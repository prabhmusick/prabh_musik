const express = require("express");
const controller = require("./orders.controller");
const authMiddleware = require("../../middleware/auth.middleware");

const router = express.Router();

const optionalAuth = (req, res, next) => {
  authMiddleware(req, res, () => next());
};

router.get("/", authMiddleware, controller.getAllOrders);
router.get("/:id", authMiddleware, controller.getOrder);
router.post("/", optionalAuth, controller.createOrder);
router.post("/verify-payment", authMiddleware, controller.verifyPayment);
router.post("/webhook/stripe", require("../payments/webhook.controller").handleWebhook);
router.put("/:id", authMiddleware, controller.updateOrder);
router.patch("/:id/status", authMiddleware, controller.updateOrderStatus);
router.delete("/:id", authMiddleware, controller.deleteOrder);

module.exports = router;
