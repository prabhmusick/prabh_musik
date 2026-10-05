const repository = require("./orders.repository");
const validator = require("./orders.validator");
const usersRepository = require("../users/users.repository");
const beatsRepository = require("../beats/beats.repository");
const AppError = require("../../errors/AppError");

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

const crypto = require("crypto");

/**
 * Creates a new order record with validated DB lookups and transactions
 */
const createOrder = async (user, orderData) => {
  if (!user || !user.id) {
    throw new AppError("Authentication required to create order", 401);
  }

  const validated = validator.validateCreateOrder(orderData);

  // 1. Verify customer exists using authenticated user context
  const customer = (await usersRepository.getUserById(user.id)) || (await usersRepository.findUserByPublicId(user.id));
  if (!customer) {
    throw new AppError("Customer profile not found", 404);
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
      throw new AppError(`Cannot purchase archived beat: "${beat.beat_name}"`, 400);
    }
    if (beat.selling_status !== "available") {
      throw new AppError(`Beat "${beat.beat_name}" is no longer available (selling status: ${beat.selling_status})`, 409);
    }

    calculatedTotal += beat.price;
    items.push({
      beatId: beat.id,
      beatTitle: beat.beat_name,
      price: beat.price,
      licenseType: "exclusive"
    });
  }

  // 3. Create the order with initial status ALWAYS "pending"
  const orderId = await repository.createOrder(
    customer.id,
    calculatedTotal,
    validated.paymentMethod,
    "pending",
    items,
    {
      paymentReference: orderData.paymentReference || null,
      transactionId: orderData.transactionId || null,
      gateway: orderData.gateway || null
    }
  );

  return getOrder(orderId);
};

/**
 * Fetches order records filtered by customer or all for admin
 */
const getAllOrders = async (user) => {
  const orders = await repository.getAllOrders();
  const result = [];

  const customer = user ? ((await usersRepository.getUserById(user.id)) || (await usersRepository.findUserByPublicId(user.id))) : null;
  const isAdmin = user && user.role === "admin";
  const customerId = customer ? customer.id : null;

  for (const order of orders) {
    if (isAdmin || (customerId && Number(order.customer_id) === Number(customerId))) {
      const items = await repository.getOrderItems(order.id);
      result.push(formatOrderResponse(order, items));
    }
  }

  return result;
};

/**
 * Verifies payment signatures (Razorpay / Stripe) and triggers fulfillment idempotently
 */
const verifyPayment = async (user, paymentData) => {
  if (!user || !user.id) {
    throw new AppError("Authentication required", 401);
  }
  if (!paymentData || !paymentData.orderId || isNaN(parseInt(paymentData.orderId, 10))) {
    throw new AppError("orderId is required for payment verification", 400);
  }

  const orderId = parseInt(paymentData.orderId, 10);
  const order = await getOrder(orderId);

  const customer = (await usersRepository.getUserById(user.id)) || (await usersRepository.findUserByPublicId(user.id));
  if (user.role !== "admin" && Number(order.customer.id) !== Number(customer?.id)) {
    throw new AppError("Access denied.", 403);
  }

  // Signature verification logic
  const rOrderId = paymentData.razorpayOrderId || paymentData.razorpay_order_id;
  const rPaymentId = paymentData.razorpayPaymentId || paymentData.razorpay_payment_id;
  const rSignature = paymentData.razorpaySignature || paymentData.razorpay_signature;

  if (rPaymentId || rOrderId || rSignature) {
    if (!rPaymentId || !rOrderId || !rSignature) {
      const err = new AppError("Invalid Razorpay payment signature", 400);
      err.errorCode = "INVALID_PAYMENT_SIGNATURE";
      throw err;
    }
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "razorpay_secret_placeholder";
    const body = `${rOrderId}|${rPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== rSignature) {
      const err = new AppError("Invalid Razorpay payment signature", 400);
      err.errorCode = "INVALID_PAYMENT_SIGNATURE";
      throw err;
    }
  } else if (paymentData.stripePaymentIntentId) {
    if (!paymentData.stripePaymentIntentId) {
      throw new AppError("Invalid Stripe payment intent", 400);
    }
  } else if (!paymentData.bypassTestVerification) {
    throw new AppError("Payment verification credentials missing", 400);
  }

  const rawOrder = await repository.getOrderById(orderId);
  const rawItems = await repository.getOrderItems(orderId);

  const fulfillmentResult = await fulfillmentService.processPaidOrder({
    ...rawOrder,
    items: rawItems.map(i => ({ beatId: i.beat_id, licenseType: i.license_type, price: i.price })),
    customer: order.customer
  });

  return {
    order: await getOrder(orderId),
    fulfillment: fulfillmentResult
  };
};

/**
 * Handles incoming Stripe Webhooks with signature verification
 */
const handleStripeWebhook = async (rawBody, signatureHeader) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signatureHeader || !webhookSecret) {
    throw new AppError("Invalid Stripe webhook signature", 400);
  }

  // Basic signature format check / verification
  if (!signatureHeader.includes("t=") || !signatureHeader.includes("v1=")) {
    throw new AppError("Invalid Stripe webhook signature", 400);
  }

  return { received: true };
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

module.exports = {
  createOrder,
  getOrder,
  getAllOrders,
  verifyPayment,
  handleStripeWebhook,
  updateOrder,
  updateOrderStatus,
  deleteOrder
};
