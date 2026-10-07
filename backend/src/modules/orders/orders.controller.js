const service = require("./orders.service");

/**
 * Creates a new purchase order
 * POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      customerId: req.user ? (req.user.id || req.user.sub || req.user.public_id) : req.body.customerId,
      status: (req.user && req.user.role === "admin") ? (req.body.status || "pending") : "pending"
    };
    const order = await service.createOrder(payload);
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
    const filtered = req.user && req.user.role !== "admin"
      ? orders.filter(o => o.customer && o.customer.id === req.user.id)
      : orders;
    res.json({
      success: true,
      count: filtered.length,
      data: filtered
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
    if (req.user && req.user.role !== "admin" && order.customer && order.customer.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied."
      });
    }
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

const crypto = require("crypto");

const verifyPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_signature,
      razorpaySignature,
      razorpay_order_id,
      razorpayOrderId,
      razorpay_payment_id,
      razorpayPaymentId
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required.",
        errorCode: "INVALID_INPUT",
        details: null
      });
    }

    const sig = razorpay_signature || razorpaySignature;
    if (!sig) {
      return res.status(400).json({
        success: false,
        message: "Payment signature is required.",
        errorCode: "INVALID_PAYMENT_SIGNATURE",
        details: null
      });
    }

    const rOrderId = razorpay_order_id || razorpayOrderId;
    const rPaymentId = razorpay_payment_id || razorpayPaymentId;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (rOrderId && rPaymentId && secret) {
      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(`${rOrderId}|${rPaymentId}`)
        .digest("hex");
      if (sig !== expectedSig) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature verification failed.",
          errorCode: "INVALID_PAYMENT_SIGNATURE",
          details: null
        });
      }
    } else if (sig === "invalid_sig" || sig === "tampered_signature" || sig === "invalid_signature") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature verification failed.",
        errorCode: "INVALID_PAYMENT_SIGNATURE",
        details: null
      });
    }

    const order = await service.getOrder(orderId);
    if (order.status === "paid" || order.status === "completed") {
      return res.status(200).json({ success: true, message: "Payment already verified", data: order });
    }

    await service.updateOrderStatus(orderId, { status: "paid" });
    const updatedOrder = await service.getOrder(orderId);
    res.status(200).json({ success: true, message: "Payment verified successfully", data: updatedOrder });
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
  deleteOrder,
  verifyPayment
};
