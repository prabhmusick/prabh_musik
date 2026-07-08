/**
 * @fileoverview Audit Event Utility
 * Abstrates audit log emission logic from underlying event targets (logger, streams, message buses).
 */

const logger = require("./logger");

/**
 * Emits a structured audit event.
 * @param {Object} event - The audit event parameters.
 * @param {string} event.name - The unique identifier of the event type.
 * @param {string|null} [event.userId] - The user public UUID.
 * @param {string} [event.message] - Human-readable narrative description.
 * @param {Object} [event.metadata] - Key-value properties containing context details.
 */
const emit = (event) => {
  if (!event || typeof event !== "object" || !event.name) {
    logger.warn({
      event: "AUDIT_EMISSION_ERROR",
      module: "audit",
      message: "Audit event is missing a name attribute."
    });
    return;
  }

  // Structured audit schema
  logger.info({
    event: event.name,
    module: "audit",
    userId: event.userId || null,
    message: event.message || `Audit event triggered: ${event.name}`,
    metadata: event.metadata || null
  });
};

const audit = {
  emit,

  /**
   * Convenience wrapper for registering new users.
   * @param {Object} details - Details of registration.
   * @param {string} details.userId - User public UUID.
   * @param {string} details.email - Normalized customer email.
   */
  userRegistered: (details = {}) => {
    audit.emit({
      name: "USER_REGISTERED",
      userId: details.userId,
      message: `User created profile successfully with email: ${details.email}`,
      metadata: { email: details.email }
    });
  },

  /**
   * Convenience wrapper for successful logins.
   * @param {Object} details - Details of login.
   * @param {string} details.userId - User public UUID.
   */
  userLoggedIn: (details = {}) => {
    audit.emit({
      name: "USER_LOGGED_IN",
      userId: details.userId,
      message: "User session initialized"
    });
  },

  /**
   * Convenience wrapper for password resets.
   * @param {Object} details - Details of reset.
   * @param {string} details.userId - User public UUID.
   */
  passwordChanged: (details = {}) => {
    audit.emit({
      name: "PASSWORD_CHANGED",
      userId: details.userId,
      message: "User password modified"
    });
  },

  /**
   * Convenience wrapper for logouts and session terminations.
   * @param {Object} details - Details of logout.
   * @param {string} details.userId - User public UUID.
   * @param {string} details.sessionId - Session UUID.
   */
  sessionRevoked: (details = {}) => {
    audit.emit({
      name: "SESSION_REVOKED",
      userId: details.userId,
      metadata: { sessionId: details.sessionId },
      message: "Session terminated successfully"
    });
  }
};

module.exports = audit;
