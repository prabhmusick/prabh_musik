const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("../../config/db").db;

/**
 * Create a Stripe Payment Intent
 * @route POST /api/payments/create-payment-intent
 */
exports.createPaymentIntent = async (req, res) => {
  const { amount, currency = "INR", email, beats, paymentMethodId } = req.body;

  if (!amount || !email || !beats) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toUpperCase(),
      payment_method: paymentMethodId,
      confirm: false,
      metadata: {
        email,
        beats: JSON.stringify(beats),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment Intent Error:", error);
    res.status(500).json({ error: error.message || "Failed to create payment intent" });
  }
};

/**
 * Handle successful payment
 * @route POST /api/payments/payment-success
 */
exports.paymentSuccess = async (req, res) => {
  const { paymentIntentId, email, beats, userId } = req.body;

  if (!paymentIntentId || !email || !beats) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // Record order in database
    const result = await new Promise((resolve, reject) => {
      const orderData = {
        email,
        userId: userId || null,
        beats: JSON.stringify(beats),
        amount: paymentIntent.amount / 100, // Convert from paise to INR
        currency: paymentIntent.currency.toUpperCase(),
        paymentIntentId,
        status: "completed",
        createdAt: new Date().toISOString(),
      };

      // Insert into orders table (you may need to create this table)
      const query = `
        INSERT INTO orders (email, user_id, beats, amount, currency, payment_intent_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        query,
        [
          orderData.email,
          orderData.userId,
          orderData.beats,
          orderData.amount,
          orderData.currency,
          orderData.paymentIntentId,
          orderData.status,
          orderData.createdAt,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.json({
      success: true,
      orderId: result,
      message: "Payment processed successfully",
    });
  } catch (error) {
    console.error("Payment Success Error:", error);
    res.status(500).json({ error: error.message || "Failed to process payment" });
  }
};

/**
 * Get payment status
 * @route GET /api/payments/payment-status/:paymentIntentId
 */
exports.getPaymentStatus = async (req, res) => {
  const { paymentIntentId } = req.params;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
    });
  } catch (error) {
    console.error("Get Payment Status Error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve payment status" });
  }
};
