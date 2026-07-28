const paymentsService = require("./payments.service");
const ordersService = require("../orders/orders.service");

/**
 * Create a Stripe Checkout Session
 * @route POST /api/payments/create-checkout-session
 */
const createCheckoutSession = async (req, res, next) => {
  const { amount, currency = "INR", email, beats } = req.body;

  if (!amount || !email || !beats) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const session = await paymentsService.createCheckoutSession({
      amount,
      currency,
      email,
      beats,
      successUrl: `${req.protocol}://${req.get("host")}/profile?payment=success`,
      cancelUrl: `${req.protocol}://${req.get("host")}/checkout`
    });

    res.json({
      url: session.url,
      sessionId: session.sessionId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a Stripe Payment Intent
 * @route POST /api/payments/create-payment-intent
 */
const createPaymentIntent = async (req, res, next) => {
  const { amount, currency = "INR", email, beats, paymentMethodId } = req.body;

  if (!amount || !email || !beats) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const paymentIntent = await paymentsService.createPaymentIntent({
      amount,
      currency,
      email,
      beats,
      paymentMethodId
    });

    res.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle successful payment (DEPRECATED)
 * @route POST /api/payments/payment-success
 */
const paymentSuccess = async (req, res, next) => {
  return res.status(410).json({
    success: false,
    message: "Payment confirmation is now handled exclusively by Stripe webhooks."
  });
};

/**
 * Get payment status
 * @route GET /api/payments/payment-status/:paymentIntentId
 */
const getPaymentStatus = async (req, res, next) => {
  const { paymentIntentId } = req.params;

  try {
    const status = await paymentsService.getPaymentStatus(paymentIntentId);
    res.json(status);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckoutSession,
  createPaymentIntent,
  paymentSuccess,
  getPaymentStatus
};
