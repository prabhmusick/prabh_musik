const express = require("express");
const controller = require("./payments.controller");
const catchAsync = require("../../utils/catchAsync");

const router = express.Router();

router.post("/create-checkout-session", catchAsync(controller.createCheckoutSession));
router.post("/create-payment-intent", catchAsync(controller.createPaymentIntent));
router.post("/payment-success", catchAsync(controller.paymentSuccess));
router.get("/payment-status/:paymentIntentId", catchAsync(controller.getPaymentStatus));

module.exports = router;
