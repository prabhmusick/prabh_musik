/**
 * @fileoverview Auto-instrumentation Tracer Utility
 * Measures performance of wrapped class/module methods and logs execution warnings if threshold limits are exceeded.
 */

const logger = require("./logger");
const metrics = require("./metrics");

const THRESHOLDS = {
  controller: 500,
  service: 300,
  repository: 150,
  storage: 2000,
  database: 200,
  stripe: 1000
};

/**
 * Wraps any sync/async function to measure duration and log telemetry if it is slow.
 * @param {string} type - Category (controller, service, repository, storage, database, stripe).
 * @param {string} operationName - Qualified name of function.
 * @param {Function} fn - Target function to instrument.
 * @returns {Function} Instrumented function.
 */
const trace = (type, operationName, fn) => {
  if (typeof fn !== "function") return fn;

  const wrapped = async function (...args) {
    const start = process.hrtime.bigint();

    // Dynamically increment counters for critical dependencies
    if (type === "database") {
      metrics.increment("databaseQueries");
    } else if (type === "storage") {
      metrics.increment("storageOperations");
    }

    try {
      const result = await fn(...args);
      return result;
    } finally {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;

      const threshold = THRESHOLDS[type] || 500;
      if (durationMs > threshold) {
        logger.warn({
          event: "SLOW_OPERATION",
          module: type,
          operation: operationName,
          duration: Math.round(durationMs),
          severity: "warning",
          message: `Slow ${type} operation: ${operationName} took ${Math.round(durationMs)}ms`
        });
      }
    }
  };

  // Preserve metadata
  Object.defineProperty(wrapped, "name", { value: fn.name, configurable: true });
  return wrapped;
};

/**
 * Instruments an entire module or class instance in-place.
 * @param {Object} moduleObj - Exports object or class instance.
 * @param {string} type - Category (service, repository, storage).
 * @param {string} namePrefix - Namespace prefix to qualify functions.
 * @returns {Object} Instrumented object reference.
 */
const wrapModule = (moduleObj, type, namePrefix = "") => {
  if (!moduleObj) return moduleObj;

  for (const key of Object.keys(moduleObj)) {
    if (typeof moduleObj[key] === "function") {
      moduleObj[key] = trace(type, `${namePrefix}.${key}`, moduleObj[key]);
    }
  }
  return moduleObj;
};

// Instrument Stripe SDK globally
try {
  const Stripe = require("stripe");
  if (Stripe && Stripe.StripeResource && Stripe.StripeResource.prototype._request) {
    const originalRequest = Stripe.StripeResource.prototype._request;
    Stripe.StripeResource.prototype._request = function (...args) {
      const start = process.hrtime.bigint();
      metrics.increment("paymentsAttempted");

      return originalRequest.apply(this, args)
        .then((res) => {
          metrics.increment("paymentsSucceeded");
          return res;
        })
        .catch((err) => {
          metrics.recordError("Payment");
          throw err;
        })
        .finally(() => {
          const end = process.hrtime.bigint();
          const durationMs = Number(end - start) / 1e6;
          if (durationMs > 1000) {
            logger.warn({
              event: "SLOW_OPERATION",
              module: "stripe",
              operation: `Stripe.${args[0]?.method || "request"}`,
              duration: Math.round(durationMs),
              severity: "warning",
              message: `Slow Stripe call: Stripe.${args[0]?.method || "request"} took ${Math.round(durationMs)}ms`
            });
          }
        });
    };
  }
} catch (e) {
  // Safe fail if stripe package structure deviates
}

module.exports = {
  trace,
  wrapModule
};
