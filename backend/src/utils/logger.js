/**
 * @fileoverview Structured Application Logger
 * Automatically injects timestamps and AsyncLocalStorage request context IDs.
 */

const { AsyncLocalStorage } = require("async_hooks");

// Context store to propagate request identifiers across async call stacks
const loggerContext = new AsyncLocalStorage();

const sensitiveKeys = [
  "password", "token", "jwt", "secret", "credential", 
  "key", "authorization", "cookie", "stripe", "refresh"
];

const sanitize = (val) => {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) {
    return val.map(sanitize);
  }
  if (typeof val === "object") {
    const cleaned = {};
    for (const k of Object.keys(val)) {
      const lowerKey = k.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        cleaned[k] = "[REDACTED]";
      } else {
        cleaned[k] = sanitize(val[k]);
      }
    }
    return cleaned;
  }
  return val;
};

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
    severity: level === "warn" ? "warning" : level,
    service: "prabh-musik-backend"
  };

  if (requestId) {
    baseLog.requestId = requestId;
  }

  let finalPayload = {};
  if (payload && typeof payload === "object") {
    const { timestamp: pTs, severity: pSev, service: pSvc, level: pLvl, ...restPayload } = payload;
    finalPayload = restPayload;
  } else {
    finalPayload = { message: String(payload) };
  }

  const structuredLog = {
    ...baseLog,
    ...finalPayload
  };

  return sanitize(structuredLog);
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
