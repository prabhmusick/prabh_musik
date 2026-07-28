const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_mock_key", {
  timeout: 10000 // 10 seconds timeout to prevent indefinite hanging (Task 7)
});
const { buildCheckoutSessionParams } = require("./checkoutSession");
const AppError = require("../../errors/AppError");
const logger = require("../../utils/logger");

/**
 * Maps Stripe errors to standard operational AppError instances
 */
const handleStripeError = (error) => {
  console.error("Stripe API Error:", error);
  if (error.type === "StripeCardError") {
    return new AppError(error.message, 400);
  }
  return new AppError("Stripe API operation failed", 500);
};

/**
 * Creates a Stripe checkout session object
 */
const createCheckoutSession = async ({ amount, currency = "INR", email, beats, successUrl, cancelUrl }) => {
  try {
    const session = await stripe.checkout.sessions.create(
      buildCheckoutSessionParams({
        amount,
        currency,
        email,
        beats,
        successUrl,
        cancelUrl
      })
    );

    logger.info({
      event: "PAYMENT_CHECKOUT_SESSION_CREATED",
      sessionId: session.id,
      email,
      amount
    });

    return {
      url: session.url,
      sessionId: session.id
    };
  } catch (error) {
    throw handleStripeError(error);
  }
};

/**
 * Creates a raw payment intent
 */
const createPaymentIntent = async ({ amount, currency = "INR", email, beats, paymentMethodId }) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toUpperCase(),
      payment_method: paymentMethodId,
      confirm: false,
      metadata: {
        email,
        beats: JSON.stringify(beats)
      }
    });

    logger.info({
      event: "PAYMENT_INTENT_CREATED",
      paymentIntentId: paymentIntent.id,
      email,
      amount
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    throw handleStripeError(error);
  }
};

/**
 * Retrieves payment status
 */
const getPaymentStatus = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase()
    };
  } catch (error) {
    throw handleStripeError(error);
  }
};

/**
 * Verifies payment intent and returns provider-agnostic verification DTO
 */
const verifyPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new AppError("Payment not completed", 400);
    }

    // Extract metadata safely
    const email = paymentIntent.metadata?.email;
    const rawBeats = paymentIntent.metadata?.beats;
    let beats = [];
    if (rawBeats) {
      try {
        beats = JSON.parse(rawBeats);
      } catch (err) {
        beats = [];
      }
    }

    const beatIds = beats.map(b => b.id).filter(id => id !== undefined);

    return {
      paymentReference: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      paymentMethod: paymentIntent.payment_method_types?.[0] || "credit_card",
      email,
      beatIds
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw handleStripeError(error);
  }
};

const constructWebhookEvent = (rawBody, signatureHeader) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new AppError("Stripe webhook secret is missing", 500);
  }
  try {
    return stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
  } catch (err) {
    throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
  }
};

module.exports = {
  createCheckoutSession,
  createPaymentIntent,
  getPaymentStatus,
  verifyPaymentIntent,
  constructWebhookEvent
};
