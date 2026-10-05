const paymentsService = require("./payments.service");
const webhookService = require("./webhook.service");
const AppError = require("../../errors/AppError");
const logger = require("../../utils/logger");

/**
 * Handle incoming Stripe webhook requests
 * @route POST /api/payments/webhook
 */
const handleWebhook = async (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return next(new AppError("Missing Stripe signature header", 400));
  }

  if (!req.rawBody) {
    return next(new AppError("Missing raw request body", 400));
  }

  try {
    // 1. Verify Stripe signature and construct verified event payload
    const event = paymentsService.constructWebhookEvent(req.rawBody, signature);

    logger.info({
      event: "WEBHOOK_RECEIVED",
      eventId: event.id,
      eventType: event.type
    });

    // 2. Delegate processing and transactional orchestration down to WebhookService
    const result = await webhookService.processEvent(event);

    res.status(200).json({
      success: true,
      skipped: !!result.skipped,
      eventId: event.id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleWebhook
};
