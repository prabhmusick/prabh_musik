const express = require("express");
const controller = require("./orders.controller");
const catchAsync = require("../../utils/catchAsync");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");

const router = express.Router();

// Public Webhook route (signature verified inside service)
router.post("/webhook/stripe", catchAsync(controller.handleStripeWebhook));

router.use(authMiddleware);

router.get("/", catchAsync(controller.getAllOrders));
router.get("/:id", catchAsync(controller.getOrder));
router.post("/", catchAsync(controller.createOrder));
router.post("/verify-payment", catchAsync(controller.verifyPayment));
router.put("/:id", requireAdmin, catchAsync(controller.updateOrder));
router.patch("/:id/status", requireAdmin, catchAsync(controller.updateOrderStatus));
router.delete("/:id", requireAdmin, catchAsync(controller.deleteOrder));

module.exports = router;
