const axios = require("axios");
const { buildCheckoutSessionParams } = require("./checkoutSession");
const AppError = require("../../errors/AppError");
const logger = require("../../utils/logger");

const razorpayBaseUrl = "https://api.razorpay.com/v1";
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

const buildRazorpayAuth = () => ({
  username: razorpayKeyId,
  password: razorpayKeySecret,
});

const handlePaymentError = (error) => {
  const razorData = error?.response?.data || error;
  console.error("Razorpay API Error:", razorData);

  // If Razorpay provided a description, surface it for easier debugging
  const description = razorData?.error?.description || razorData?.message || null;
  const message = description
    ? `Razorpay API operation failed: ${description}`
    : "Razorpay API operation failed";

  return new AppError(message, 500);
};

const ensureRazorpayConfigured = () => {
  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new AppError(
      "Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the environment",
      500
    );
  }
};

const createCheckoutSession = async ({ amount, currency = "INR", email, beats, successUrl, cancelUrl }) => {
  try {
    ensureRazorpayConfigured();
    const orderPayload = buildCheckoutSessionParams({
      amount,
      currency,
      email,
      beats,
      successUrl,
      cancelUrl,
    });

    const response = await axios.post(`${razorpayBaseUrl}/orders`, orderPayload, {
      auth: buildRazorpayAuth(),
      headers: { "Content-Type": "application/json" },
    });

    logger.info({
      event: "PAYMENT_CHECKOUT_SESSION_CREATED",
      orderId: response.data.id,
      email,
      amount,
    });

    return {
      url: successUrl,
      sessionId: response.data.id,
      orderId: response.data.id,
      amount: response.data.amount,
      currency: response.data.currency,
      keyId: razorpayKeyId,
    };
  } catch (error) {
    throw handlePaymentError(error);
  }
};

const createPaymentIntent = async ({ amount, currency = "INR", email, beats, paymentMethodId }) => {
  try {
    ensureRazorpayConfigured();
    const orderPayload = buildCheckoutSessionParams({
      amount,
      currency,
      email,
      beats,
      successUrl: "",
      cancelUrl: "",
    });

    const response = await axios.post(`${razorpayBaseUrl}/orders`, orderPayload, {
      auth: buildRazorpayAuth(),
      headers: { "Content-Type": "application/json" },
    });

    logger.info({
      event: "PAYMENT_INTENT_CREATED",
      paymentIntentId: response.data.id,
      email,
      amount,
    });

    return {
      clientSecret: response.data.id,
      paymentIntentId: response.data.id,
      orderId: response.data.id,
    };
  } catch (error) {
    throw handlePaymentError(error);
  }
};

const getPaymentStatus = async (paymentIntentId) => {
  try {
    ensureRazorpayConfigured();
    const response = await axios.get(`${razorpayBaseUrl}/orders/${paymentIntentId}`, {
      auth: buildRazorpayAuth(),
    });
    return {
      status: response.data.status,
      amount: response.data.amount / 100,
      currency: response.data.currency.toUpperCase(),
    };
  } catch (error) {
    throw handlePaymentError(error);
  }
};

const verifyPaymentIntent = async (paymentIntentId) => {
  try {
    ensureRazorpayConfigured();
    const response = await axios.get(`${razorpayBaseUrl}/orders/${paymentIntentId}`, {
      auth: buildRazorpayAuth(),
    });

    if (response.data.status !== "paid") {
      throw new AppError("Payment not completed", 400);
    }

    const email = response.data.notes?.email;
    const rawBeats = response.data.notes?.beats;
    let beats = [];
    if (rawBeats) {
      try {
        beats = JSON.parse(rawBeats);
      } catch (err) {
        beats = [];
      }
    }

    const beatIds = beats.map((b) => b.id).filter((id) => id !== undefined);

    return {
      paymentReference: response.data.id,
      amount: response.data.amount,
      currency: response.data.currency.toUpperCase(),
      paymentMethod: "razorpay",
      email,
      beatIds,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw handlePaymentError(error);
  }
};

const constructWebhookEvent = (rawBody, signatureHeader) => {
  return {
    id: "razorpay-webhook",
    type: "payment.captured",
    data: { object: { id: signatureHeader || "razorpay-webhook" } },
  };
};

module.exports = {
  createCheckoutSession,
  createPaymentIntent,
  getPaymentStatus,
  verifyPaymentIntent,
  constructWebhookEvent,
};
