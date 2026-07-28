const repository = require("./orders.repository");
const validator = require("./orders.validator");
const usersRepository = require("../users/users.repository");
const beatsRepository = require("../beats/beats.repository");
const AppError = require("../../errors/AppError");
const logger = require("../../utils/logger");

/**
 * Formats a raw order and its items into a populated public payload
 */
const formatOrderResponse = (order, items) => {
  return {
    id: order.id,
    customer: {
      id: order.customer_id,
      name: order.customer_name,
      email: order.customer_email
    },
    totalAmount: order.total_amount,
    paymentMethod: order.payment_method,
    status: order.status,
    fulfillmentStatus: order.fulfillment_status,
    fulfilledAt: order.fulfilled_at,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: items.map(item => ({
      beatId: item.beat_id,
      title: item.beat_title,
      price: item.price,
      licenseType: item.license_type
    }))
  };
};

/**
 * Retrieves a single order by ID with populated relation objects
 */
const getOrder = async (id) => {
  if (!id) {
    throw new AppError("Order ID is required", 400);
  }

  const order = await repository.getOrderById(id);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const items = await repository.getOrderItems(id);
  return formatOrderResponse(order, items);
};

const fulfillmentService = require("./fulfillment.service");

/**
 * Placeholder for ownership generation in Sprint 4
 */
const createOwnerships = async (order) => {
  await fulfillmentService.processPaidOrder(order);
};

/**
 * Creates a new order record with validated DB lookups and transactions
 */
const createOrder = async (orderData) => {
  const validated = validator.validateCreateOrder(orderData);

  // 1. Verify customer exists
  const customer = await usersRepository.getUserById(validated.customerId);
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  // 2. Lookup beats dynamically to verify existence, status, price, and snapshot titles
  const items = [];
  let calculatedTotal = 0;

  for (const beatId of validated.beatIds) {
    const beat = await beatsRepository.getBeatById(beatId);
    if (!beat) {
      throw new AppError(`Beat not found: ID ${beatId}`, 404);
    }
    if (beat.status === "archived") {
      throw new AppError(`Cannot purchase archived beat: "${beat.title}"`, 400);
    }
    if (beat.status !== "published") {
      throw new AppError(`Beat "${beat.title}" is no longer available (status: ${beat.status})`, 400);
    }

    calculatedTotal += beat.price_amount;
    items.push({
      beatId: beat.id,
      beatTitle: beat.title,
      price: beat.price_amount,
      licenseType: "exclusive" // Defaulting to exclusive per requirements
    });
  }

  // 3. Create the order using transaction rollback on failure
  const orderId = await repository.createOrder(
    validated.customerId,
    calculatedTotal,
    validated.paymentMethod,
    validated.status,
    items,
    {
      paymentReference: orderData.paymentReference || null,
      transactionId: orderData.transactionId || null,
      gateway: orderData.gateway || null
    }
  );

  logger.info({
    event: "ORDER_CREATED",
    orderId,
    customerId: validated.customerId,
    totalAmount: calculatedTotal,
    paymentMethod: validated.paymentMethod,
    beatCount: items.length
  });

  const order = await getOrder(orderId);

  // 4. Ownership triggering mock hook
  if (validated.status === "paid") {
    await createOwnerships(order);
    return getOrder(orderId);
  }

  return order;
};

/**
 * Fetches all order records (excluding soft-deleted/cancelled orders)
 */
const getAllOrders = async () => {
  const orders = await repository.getAllOrders();
  const result = [];
  
  for (const order of orders) {
    const items = await repository.getOrderItems(order.id);
    result.push(formatOrderResponse(order, items));
  }
  
  return result;
};

/**
 * Validates allowed status transitions for orders.
 */
const validateStatusTransition = (currentStatus, nextStatus) => {
  const current = String(currentStatus).toLowerCase();
  const next = String(nextStatus).toLowerCase();
  if (current === next) return;

  if (current === "pending") {
    const allowed = ["paid", "failed", "cancelled"];
    if (!allowed.includes(next)) {
      throw new AppError(`Invalid status transition from '${current}' to '${next}'`, 400);
    }
    return;
  }

  if (current === "paid") {
    const allowed = ["refunded"];
    if (!allowed.includes(next)) {
      throw new AppError(`Invalid status transition from '${current}' to '${next}'`, 400);
    }
    return;
  }

  throw new AppError(`Cannot transition status from terminal state '${current}' to '${next}'`, 400);
};

/**
 * Updates properties of an order record.
 */
const updateOrder = async (id, updates) => {
  const existingOrder = await getOrder(id);
  const cleanUpdates = {};
  
  if (updates.paymentMethod !== undefined) {
    cleanUpdates.payment_method = updates.paymentMethod;
  }
  
  if (updates.status !== undefined) {
    const { status } = validator.validateStatusUpdate({ status: updates.status });
    validateStatusTransition(existingOrder.status, status);
    cleanUpdates.status = status;
  }

  if (Object.keys(cleanUpdates).length === 0) {
    return existingOrder;
  }

  const success = await repository.updateOrder(id, cleanUpdates);
  if (!success) {
    throw new AppError("No changes made or order update failed", 400);
  }

  const order = await getOrder(id);

  if (cleanUpdates.status === "paid") {
    await createOwnerships(order);
  }

  return order;
};

/**
 * Updates status specifically
 */
const updateOrderStatus = async (id, statusData) => {
  const existingOrder = await getOrder(id); // Throws 404 if order does not exist
  const { status } = validator.validateStatusUpdate(statusData);

  validateStatusTransition(existingOrder.status, status);

  const success = await repository.updateOrderStatus(id, status);
  if (!success) {
    throw new AppError("Status update failed", 400);
  }

  const order = await getOrder(id);

  if (status === "paid") {
    await createOwnerships(order);
  }

  return order;
};

/**
 * Soft deletes an order by changing status to 'cancelled'
 */
const deleteOrder = async (id) => {
  await getOrder(id); // Throws 404 if order does not exist
  const success = await repository.deleteOrder(id);
  if (!success) {
    throw new AppError("Failed to cancel/soft-delete order", 400);
  }
  return true;
};

/**
 * Confirms payment for beats, creating a paid order record and triggering downstream fulfillment
 */
const confirmPayment = async ({ email, userId, beatIds, paymentReference, paymentMethod }) => {
  if (!paymentReference) {
    throw new AppError("Payment reference is required for confirmation", 400);
  }

  // 1. Idempotency Check: check if order with this payment reference already exists
  const existingOrder = await repository.getOrderByPaymentReference(paymentReference);
  if (existingOrder) {
    return getOrder(existingOrder.id);
  }

  // 2. Identify and verify customer exists
  let customerId = userId;
  if (!customerId) {
    if (!email) {
      throw new AppError("Either customerId or email must be provided to confirm payment", 400);
    }
    const user = await usersRepository.findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new AppError(`Customer with email ${email} not found`, 404);
    }
    customerId = user.id;
  } else {
    const user = await usersRepository.getUserById(customerId);
    if (!user) {
      throw new AppError(`Customer not found (ID: ${customerId})`, 404);
    }
  }

  // 3. Create the paid order using the standard service order creation orchestration
  const order = await createOrder({
    customerId,
    beatIds,
    paymentMethod: paymentMethod || "credit_card",
    status: "paid",
    paymentReference,
    transactionId: paymentReference,
    gateway: "stripe"
  });

  logger.info({
    event: "ORDER_PAYMENT_CONFIRMED",
    orderId: order.id,
    customerId,
    paymentReference,
    gateway: "stripe"
  });

  return order;
};

module.exports = {
  createOrder,
  getOrder,
  getAllOrders,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  confirmPayment
};
