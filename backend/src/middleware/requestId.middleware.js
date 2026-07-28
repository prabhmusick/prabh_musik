const crypto = require("crypto");
const { loggerContext } = require("../utils/logger");
const logger = require("../utils/logger");
const metrics = require("../utils/metrics");

/**
 * Request ID middleware.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware callback.
 * @returns {void}
 */
const requestIdMiddleware = (req, res, next) => {
  // Reuse X-Request-Id if supplied in request headers, otherwise generate a v4 UUID
  const requestId = req.headers["x-request-id"] || req.headers["x-correlation-id"] || crypto.randomUUID();
  const start = process.hrtime.bigint();

  // Attach to request object
  req.id = requestId;

  // Set response header
  res.setHeader("X-Request-Id", requestId);

  // Globally intercept res.json to inject requestId into all error responses (including validation errors)
  const originalJson = res.json;
  res.json = function (body) {
    if (body && typeof body === "object" && body.success === false) {
      body.requestId = requestId;
    }
    return originalJson.call(this, body);
  };

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    const userId = req.user ? req.user.id : null;
    const statusCode = res.statusCode;

    if (userId) {
      metrics.recordUserActive(userId);
    }

    metrics.recordRequest(req.method, req.path, statusCode, durationMs);

    loggerContext.run({ requestId }, () => {
      if (durationMs > 500) {
        logger.warn({
          event: "SLOW_REQUEST",
          method: req.method,
          path: req.path,
          statusCode,
          duration: Math.round(durationMs),
          userId,
          severity: "warning",
          message: `Slow HTTP Request: ${req.method} ${req.path} took ${Math.round(durationMs)}ms`
        });
      }

      logger.info({
        event: "REQUEST_COMPLETED",
        method: req.method,
        path: req.path,
        statusCode,
        duration: Math.round(durationMs),
        userId,
        severity: "info",
        message: `${req.method} ${req.path} completed with ${statusCode} in ${Math.round(durationMs)}ms`
      });
    });
  });

  // Propagate correlation context to the async execution thread
  loggerContext.run({ requestId }, () => {
    next();
  });
};

module.exports = requestIdMiddleware;
