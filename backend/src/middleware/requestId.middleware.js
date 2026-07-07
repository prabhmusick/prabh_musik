const crypto = require("crypto");
const { loggerContext } = require("../utils/logger");

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

  // Propagate correlation context to the async execution thread
  loggerContext.run({ requestId }, () => {
    next();
  });
};

module.exports = requestIdMiddleware;
