const paymentsService = require("./payments.service");
const ordersService = require("../orders/orders.service");
const beatsRepository = require("../beats/beats.repository");
const usersRepository = require("../users/users.repository");
const crypto = require("crypto");

/**
 * Validates cart beats against the authoritative database records,
 * ensures items are published and not archived, and calculates the authoritative price.
 */
const validateAndCalculateCart = async (beats) => {
  if (!beats || !Array.isArray(beats) || beats.length === 0) {
    const error = new Error("At least one beat is required for checkout");
    error.status = 400;
    throw error;
  }

  let authoritativeAmount = 0;
  const validatedBeats = [];

  for (const item of beats) {
    const beatId = item.id || item.public_id || item;
    if (!beatId) {
      const error = new Error("Invalid beat item in cart");
      error.status = 400;
      throw error;
    }

    const beat = /^\d+$/.test(String(beatId))
      ? await beatsRepository.getBeatById(Number(beatId))
      : await beatsRepository.findByPublicId(String(beatId));

    if (!beat) {
      const error = new Error(`Beat not found: ID ${beatId}`);
      error.status = 404;
      throw error;
    }

    if (beat.status === "archived") {
      const error = new Error(`Cannot purchase archived beat: "${beat.title}"`);
      error.status = 409;
      throw error;
    }

    if (beat.status !== "published") {
      const error = new Error(`Beat "${beat.title}" is no longer available (status: ${beat.status})`);
      error.status = 400;
      throw error;
    }

    const priceAmount = Number(beat.price_amount);
    if (isNaN(priceAmount) || priceAmount <= 0) {
      const error = new Error(`Beat "${beat.title}" does not have valid pricing`);
      error.status = 400;
      throw error;
    }

    authoritativeAmount += priceAmount;
    validatedBeats.push({
      id: beat.public_id || beat.id,
      title: beat.title,
      price: priceAmount / 100,
      price_amount: priceAmount,
    });
  }

  if (authoritativeAmount <= 0) {
    const error = new Error("Cart total must be greater than zero");
    error.status = 400;
    throw error;
  }

  return { authoritativeAmount, validatedBeats };
};

/**
 * Resolves customer from authenticated session
 */
const resolveCustomer = async (req) => {
  if (!req.user || !req.user.id) {
    const error = new Error("Authentication token is missing or invalid.");
    error.status = 401;
    throw error;
  }

  const customer = /^\d+$/.test(String(req.user.id))
    ? await usersRepository.getUserById(Number(req.user.id))
    : await usersRepository.findUserByPublicId(String(req.user.id));

  if (!customer) {
    const error = new Error("Customer profile not found");
    error.status = 401;
    throw error;
  }

  return customer;
};

/**
 * Create a Razorpay Checkout Session with Authoritative DB Pricing
 * @route POST /api/payments/create-checkout-session
 */
const createCheckoutSession = async (req, res, next) => {
  try {
    const customer = await resolveCustomer(req);
    const { currency = "INR", email, beats } = req.body;

    const customerEmail = (email && String(email).trim()) || customer.email;
    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    const { authoritativeAmount, validatedBeats } = await validateAndCalculateCart(beats);

    const frontendBase =
      process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const session = await paymentsService.createCheckoutSession({
      amount: authoritativeAmount, // Authoritative price looked up from database (in paise)
      currency: (currency || "INR").toUpperCase(),
      email: customerEmail,
      beats: validatedBeats,
      userId: customer.id,
      successUrl: `${frontendBase}/profile?payment=success`,
      cancelUrl: `${frontendBase}/checkout`,
    });

    res.json({
      url: session.url,
      sessionId: session.sessionId,
      orderId: session.orderId,
      amount: session.amount,
      currency: session.currency,
      keyId: session.keyId,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Create a Razorpay Payment Intent with Authoritative DB Pricing
 * @route POST /api/payments/create-payment-intent
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const customer = await resolveCustomer(req);
    const { currency = "INR", email, beats, paymentMethodId } = req.body;

    const customerEmail = (email && String(email).trim()) || customer.email;
    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    const { authoritativeAmount, validatedBeats } = await validateAndCalculateCart(beats);

    const paymentIntent = await paymentsService.createPaymentIntent({
      amount: authoritativeAmount,
      currency: (currency || "INR").toUpperCase(),
      email: customerEmail,
      beats: validatedBeats,
      userId: customer.id,
      paymentMethodId,
    });

    res.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Handle successful payment
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
    const expectedSignature = crypto
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
