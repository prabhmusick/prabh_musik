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
    const frontendBase =
      process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const session = await paymentsService.createCheckoutSession({
      amount,
      currency,
      email,
      beats,
      userId: req.user.id,
      successUrl: `${frontendBase}/profile?payment=success`,
      cancelUrl: `${frontendBase}/checkout`,
    });

    // Return the full session payload so the frontend can open the Razorpay widget
    res.json({
      url: session.url,
      sessionId: session.sessionId,
      orderId: session.orderId,
      amount: session.amount,
      currency: session.currency,
      keyId: session.keyId,
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
      paymentMethodId,
    });

    res.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
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
  const { orderId, paymentId, signature } = req.body;
  if (!orderId || !paymentId || !signature) {
    return res
      .status(400)
      .json({ error: "Razorpay payment details are required" });
  }

  try {
    const expectedSignature = require("crypto")
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    if (expectedSignature !== signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const payment = await paymentsService.verifyPaymentIntent(orderId);
    const order = await ordersService.confirmPayment({
      userId: req.user.id,
      beatIds: payment.beatIds,
      paymentReference: payment.paymentReference,
      paymentMethod: payment.paymentMethod,
    });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
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
  getPaymentStatus,
};
