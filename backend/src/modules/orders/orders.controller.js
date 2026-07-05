const service = require("./orders.service");

/**
 * Creates a new purchase order
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  const order = await service.createOrder(req.body);
  res.status(201).json({
    success: true,
    data: order
  });
};

/**
 * Lists all orders (excluding cancelled)
 * GET /api/orders
 */
const getAllOrders = async (req, res) => {
  const orders = await service.getAllOrders();
  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
};

/**
 * Gets a single order by ID
 * GET /api/orders/:id
 */
const getOrder = async (req, res) => {
  const order = await service.getOrder(req.params.id);
  res.json({
    success: true,
    data: order
  });
};

/**
 * Updates an order record dynamically
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
 * Updates order status specifically
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
 * Soft deletes/cancels an order
 * DELETE /api/orders/:id
 */
const deleteOrder = async (req, res) => {
  await service.deleteOrder(req.params.id);
  res.json({
    success: true,
    message: "Order cancelled and archived successfully."
  });
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
};
