const service = require("./orders.service");
const AppError = require("../../errors/AppError");

/**
 * Creates a new purchase order
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  const order = await service.createOrder(req.user, req.body);
  res.status(201).json({
    success: true,
    data: order
  });
};

/**
 * Lists orders (Filtered by customer or all for admin)
 * GET /api/orders
 */
const getAllOrders = async (req, res) => {
  const orders = await service.getAllOrders(req.user);
  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
};

/**
 * Gets a single order by ID with ownership check
 * GET /api/orders/:id
 */
const getOrder = async (req, res) => {
  const order = await service.getOrder(req.params.id);

  if (req.user.role !== "admin") {
    if (String(req.user.id) !== String(order.customer.id) && String(req.user.id) !== String(order.customer.public_id)) {
      throw new AppError("Access denied.", 403);
    }
  }

  res.json({
    success: true,
    data: order
  });
};

/**
 * Server-side payment verification (Razorpay / Stripe)
 * POST /api/orders/verify-payment
 */
const verifyPayment = async (req, res) => {
  const result = await service.verifyPayment(req.user, req.body);
  res.json({
    success: true,
    data: result
  });
};

/**
 * Updates an order record dynamically (Admin only)
 * PUT /api/orders/:id
 */
const updateOrder = async (req, res) => {
  const order = await service.updateOrder(req.params.id, req.body);
  res.json({
    success: true,
    data: order
  });
};

/**
 * Updates order status specifically (Admin only)
 * PATCH /api/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
  const order = await service.updateOrderStatus(req.params.id, req.body);
  res.json({
    success: true,
    data: order
  });
};

/**
 * Soft deletes/cancels an order (Admin only)
 * DELETE /api/orders/:id
 */
const deleteOrder = async (req, res) => {
  await service.deleteOrder(req.params.id);
  res.json({
    success: true,
    message: "Order cancelled and archived successfully."
  });
};

/**
 * Webhook handler for Stripe payment events
 * POST /api/orders/webhook/stripe
 */
const handleStripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const result = await service.handleStripeWebhook(req.body, signature);
  res.json({ success: true, data: result });
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrder,
  verifyPayment,
  handleStripeWebhook,
  updateOrder,
  updateOrderStatus,
  deleteOrder
};
