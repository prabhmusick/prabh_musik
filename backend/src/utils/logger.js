/**
 * @fileoverview Structured Application Logger
 * Automatically injects timestamps and AsyncLocalStorage request context IDs.
 */

const { AsyncLocalStorage } = require("async_hooks");

// Context store to propagate request identifiers across async call stacks
const loggerContext = new AsyncLocalStorage();

/**
 * Normalizes log payloads to structured objects, merging context details.
 * @param {string} level - Log level string (info, warn, error).
 * @param {string|Object} payload - User log message or structured details.
 * @returns {Object} Structured log object.
 */
const formatLog = (level, payload) => {
  const store = loggerContext.getStore() || {};
  const timestamp = new Date().toISOString();
  const requestId = store.requestId || null;

  const baseLog = {
    timestamp,
    level
  };

  if (requestId) {
    baseLog.requestId = requestId;
  }

  if (payload && typeof payload === "object") {
    // Exclude timestamp and level from payload if they exist to prevent overriding
    const { timestamp: pTs, level: pLvl, ...restPayload } = payload;
    return {
      ...baseLog,
      ...restPayload
    };
  }

  return {
    ...baseLog,
    message: String(payload)
  };
};

const logger = {
  loggerContext,

  info: (payload, ...args) => {
    console.log(formatLog("info", payload), ...args);
  },

  warn: (payload, ...args) => {
    console.warn(formatLog("warn", payload), ...args);
  },

  error: (payload, ...args) => {
    console.error(formatLog("error", payload), ...args);
  }
};

module.exports = logger;
