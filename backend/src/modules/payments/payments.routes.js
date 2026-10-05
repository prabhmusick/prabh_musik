const express = require("express");
const controller = require("./payments.controller");
const webhookController = require("./webhook.controller");
const { rateLimit } = require("../../middleware/rateLimit.middleware");
const authMiddleware = require("../../middleware/auth.middleware");

const router = express.Router();

const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many payment operations from this IP, please try again later.",
});

router.post(
  "/create-checkout-session",
  authMiddleware,
  paymentRateLimiter,
  controller.createCheckoutSession,
);
router.post(
  "/create-payment-intent",
  authMiddleware,
  paymentRateLimiter,
  controller.createPaymentIntent,
);
router.post(
  "/payment-success",
  authMiddleware,
  paymentRateLimiter,
  controller.paymentSuccess,
);
router.post("/webhook", webhookController.handleWebhook);
router.get(
  "/payment-status/:paymentIntentId",
  authMiddleware,
  paymentRateLimiter,
  controller.getPaymentStatus,
);

module.exports = router;
