const webhookRepository = require("./webhook.repository");
const ordersService = require("../orders/orders.service");
const ordersRepository = require("../orders/orders.repository");
const { executeTransaction } = require("../../config/transaction");
const AppError = require("../../errors/AppError");
const logger = require("../../utils/logger");

/**
 * Parses beats field from metadata safely.
 */
const parseBeatIds = (metadataBeats) => {
  if (!metadataBeats) return [];
  try {
    const parsed = JSON.parse(metadataBeats);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === "object" ? item.id || item.beatId : item));
    }
    return [];
  } catch (err) {
    logger.warn({
      event: "WEBHOOK_BEAT_PARSE_FAILED",
      metadataBeats,
      error: err.message
    });
    return [];
  }
};

/**
 * Process a verified Stripe event.
 * Enforces transaction safety and event idempotency.
 *
 * @param {Object} event - The verified Stripe event payload.
 * @returns {Promise<Object>} Execution result profile.
 */
const processEvent = async (event) => {
  const eventId = event.id;
  const eventType = event.type;

  // 1. Idempotency Check
  const isAlreadyProcessed = await webhookRepository.hasProcessed(eventId);
  if (isAlreadyProcessed) {
    logger.info({
      event: "WEBHOOK_EVENT_DUPLICATE",
      eventId,
      eventType
    });
    return { success: true, skipped: true, message: "Event already processed." };
  }

  // 2. Mark event status as RECEIVED (initially)
  await webhookRepository.markProcessed(eventId, eventType, "RECEIVED");

  try {
    // 3. Run fulfillment chain inside single transaction boundaries
    const result = await executeTransaction(async (tx) => {
      // Transition event to PROCESSING
      await webhookRepository.markProcessed(eventId, eventType, "PROCESSING");

      if (eventType === "checkout.session.completed") {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          const email = session.metadata?.email || session.customer_email || session.customer_details?.email;
          const beatIds = parseBeatIds(session.metadata?.beats);
          const paymentReference = session.payment_intent || session.id;
          const paymentMethod = session.payment_method_types?.[0] || "credit_card";

          await ordersService.confirmPayment({
            email,
            beatIds,
            paymentReference,
            paymentMethod
          });
        }
      } else if (eventType === "payment_intent.succeeded") {
        const pi = event.data.object;
        const email = pi.metadata?.email;
        const beatIds = parseBeatIds(pi.metadata?.beats);
        const paymentReference = pi.id;
        const paymentMethod = pi.payment_method_types?.[0] || "credit_card";

        if (email && beatIds.length > 0) {
          await ordersService.confirmPayment({
            email,
            beatIds,
            paymentReference,
            paymentMethod
          });
        }
      } else if (eventType === "payment_intent.payment_failed") {
        const pi = event.data.object;
        const paymentReference = pi.id;
        const failureReason = pi.last_payment_error?.message || "Payment intent failed";

        logger.warn({
          event: "WEBHOOK_PAYMENT_FAILED",
          paymentReference,
          failureReason
        });

        const order = await ordersRepository.getOrderByPaymentReference(paymentReference);
        if (order) {
          await ordersService.updateOrderStatus(order.id, { status: "failed" });
        }
      } else if (eventType === "checkout.session.expired") {
        const session = event.data.object;
        const paymentReference = session.payment_intent || session.id;

        logger.warn({
          event: "WEBHOOK_CHECKOUT_EXPIRED",
          paymentReference
        });

        const order = await ordersRepository.getOrderByPaymentReference(paymentReference);
        if (order) {
          await ordersService.updateOrderStatus(order.id, { status: "cancelled" });
        }
      } else {
        logger.info({
          event: "WEBHOOK_UNSUPPORTED_EVENT",
          eventId,
          eventType
        });
      }

      // Mark the event as successfully PROCESSED inside transaction block
      await webhookRepository.markProcessed(eventId, eventType, "PROCESSED");

      return { success: true, skipped: false };
    });

    return result;
  } catch (error) {
    logger.error({
      event: "WEBHOOK_PROCESSING_FAILED",
      eventId,
      eventType,
      error: error.message
    });

    // Mark event status as FAILED with failure reason outside transaction (so it persists)
    await webhookRepository.markProcessed(eventId, eventType, "FAILED", {
      failureReason: error.message || String(error)
    });

    throw error;
  }
};

module.exports = {
  processEvent
};
