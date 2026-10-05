const service = require("./orders.service");

/**
 * Creates a new purchase order
 * POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const order = await service.createOrder(req.body);
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lists all orders (excluding cancelled)
 * GET /api/orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await service.getAllOrders();
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a single order by ID
 * GET /api/orders/:id
 */
const getOrder = async (req, res, next) => {
  try {
    const order = await service.getOrder(req.params.id);
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an order record dynamically
 * PUT /api/orders/:id
 */
const updateOrder = async (req, res, next) => {
  try {
    const order = await service.updateOrder(req.params.id, req.body);
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates order status specifically
 * PATCH /api/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await service.updateOrderStatus(req.params.id, req.body);
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft deletes/cancels an order
 * DELETE /api/orders/:id
 */
const deleteOrder = async (req, res, next) => {
  try {
    await service.deleteOrder(req.params.id);
    res.json({
      success: true,
      message: "Order cancelled and archived successfully."
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
};
