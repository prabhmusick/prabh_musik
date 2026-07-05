const ordersRepository = require("./orders.repository");
const ownershipsService = require("../ownerships/ownerships.service");
const beatsService = require("../beats/beats.service");
const AppError = require("../../errors/AppError");

const FULFILLMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed"
};

/**
 * Audit / notification post-database hooks (stubbed placeholders)
 */
const sendPurchaseEmail = async (order) => {
  // TODO: Sprint 5 Email delivery integration
  return;
};

const generateDownloadAssets = async (order) => {
  // TODO: Sprint 5 R2 pre-signed downloads integration
  return;
};

const queueAnalytics = async (order) => {
  // TODO: Analytics queue integration
  return;
};

/**
 * Handles paid order fulfillment. Fully transactional and idempotent.
 *
 * @param {object} order - Structurally populated order object
 * @returns {Promise<object>} Fulfillment Result metadata
 */
const processPaidOrder = async (order) => {
  if (!order || !order.id) {
    throw new AppError("Invalid order snapshot for fulfillment", 400);
  }

  // 1. Idempotency Check: Already Completed
  if (order.fulfillment_status === FULFILLMENT_STATUS.COMPLETED || order.fulfilled_at) {
    return {
      success: true,
      skipped: true,
      orderId: order.id,
      ownershipsCreated: 0,
      fulfillmentStatus: FULFILLMENT_STATUS.COMPLETED,
      fulfilledAt: order.fulfilled_at,
      warnings: []
    };
  }

  const hasOwnerships = await ownershipsService.hasOwnershipsForOrder(order.id);
  if (hasOwnerships) {
    return {
      success: true,
      skipped: true,
      orderId: order.id,
      ownershipsCreated: 0,
      fulfillmentStatus: FULFILLMENT_STATUS.COMPLETED,
      fulfilledAt: order.fulfilled_at || new Date().toISOString(),
      warnings: ["Ownership records already exist for this order"]
    };
  }

  // 2. Concurrency Processing Lock Guard
  if (order.fulfillment_status === FULFILLMENT_STATUS.PROCESSING) {
    throw new AppError("Order fulfillment already in progress", 409);
  }

  // 3. Database Transaction boundaries orchestrated completely by persistence helper
  const transactionResult = await ordersRepository.executeFulfillmentTransaction(order.id, async (tx, context) => {
    // A. Concurrency state lock check
    const lockAcquired = await ordersRepository.acquireFulfillmentLock(order.id, tx);
    if (!lockAcquired) {
      throw new AppError("Failed to acquire order lock", 409);
    }
    context.lockAcquired = true;

    // B. Create Snapshot digital asset ownerships
    await ownershipsService.createOwnershipsFromOrder(order, tx);

    // C. Update Exclusive Beat inventory
    await beatsService.handleOrderFulfillment(order, tx);

    // D. Update status to completed
    await ordersRepository.completeFulfillment(order.id, tx);

    return {
      lockAcquired: true,
      ownershipsCreated: order.items ? order.items.length : 0
    };
  });

  // 4. Side Effects executed safely after successful transaction commit
  try {
    await sendPurchaseEmail(order);
    await generateDownloadAssets(order);
    await queueAnalytics(order);
  } catch (warningErr) {
    console.warn("Fulfillment side effect warning:", warningErr.message || warningErr);
  }

  return {
    success: true,
    skipped: false,
    orderId: order.id,
    ownershipsCreated: transactionResult.ownershipsCreated,
    fulfillmentStatus: FULFILLMENT_STATUS.COMPLETED,
    fulfilledAt: new Date().toISOString(),
    warnings: []
  };
};

module.exports = {
  FULFILLMENT_STATUS,
  processPaidOrder
};
