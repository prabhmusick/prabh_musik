const { db } = require("../../config/db");
const RepositoryError = require("../../errors/RepositoryError");

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(new RepositoryError(`Database run error: ${err.message}`, err));
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(new RepositoryError(`Database get error: ${err.message}`, err));
      } else {
        resolve(row);
      }
    });
  });
};

/**
 * Retrieves a processed webhook event profile by its Stripe event ID.
 *
 * @param {string} eventId - Unique Stripe event ID.
 * @returns {Promise<Object|null>} The event row profile or null.
 */
const getProcessedEvent = async (eventId) => {
  const sql = `
    SELECT id, event_id, event_type, status, received_at, processed_at, failure_reason
    FROM processed_webhook_events
    WHERE event_id = ?
    LIMIT 1
  `;
  try {
    const row = await get(sql, [eventId]);
    return row || null;
  } catch (err) {
    throw new RepositoryError(`Failed to fetch processed event by ID: ${err.message}`, err);
  }
};

/**
 * Checks if a Stripe event was already successfully processed.
 *
 * @param {string} eventId - Unique Stripe event ID.
 * @returns {Promise<boolean>} True if status is PROCESSED.
 */
const hasProcessed = async (eventId) => {
  const event = await getProcessedEvent(eventId);
  return event !== null && event.status === "PROCESSED";
};

/**
 * Creates or updates the status of a processed webhook event.
 *
 * @param {string} eventId - Stripe event ID.
 * @param {string} eventType - Stripe event type (e.g. checkout.session.completed).
 * @param {string} status - Webhook event status ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED').
 * @param {Object} [extra={}] - Additional fields.
 * @returns {Promise<boolean>} True if the operation succeeded.
 */
const markProcessed = async (eventId, eventType, status, extra = {}) => {
  const existing = await getProcessedEvent(eventId);
  const processedAt = (status === "PROCESSED" || status === "FAILED") ? new Date().toISOString() : null;
  const failureReason = extra.failureReason || null;

  if (existing) {
    const sql = `
      UPDATE processed_webhook_events
      SET status = ?,
          processed_at = ?,
          failure_reason = ?
      WHERE event_id = ?
    `;
    try {
      const result = await run(sql, [status, processedAt, failureReason, eventId]);
      return result.changes > 0;
    } catch (err) {
      throw new RepositoryError(`Failed to update processed event status: ${err.message}`, err);
    }
  } else {
    const sql = `
      INSERT INTO processed_webhook_events (
        event_id,
        event_type,
        status,
        processed_at,
        failure_reason
      ) VALUES (?, ?, ?, ?, ?)
    `;
    try {
      const result = await run(sql, [eventId, eventType, status, processedAt, failureReason]);
      return result.id !== null;
    } catch (err) {
      throw new RepositoryError(`Failed to insert processed event: ${err.message}`, err);
    }
  }
};

module.exports = {
  getProcessedEvent,
  hasProcessed,
  markProcessed
};
