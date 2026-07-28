/**
 * @fileoverview Global Express Error Handling Middleware
 * Intercepts all uncaught application exceptions and formats standardized JSON error responses.
 */

const AppError = require("../errors/AppError");
const RepositoryError = require("../errors/RepositoryError");
const logger = require("../utils/logger");
const metrics = require("../utils/metrics");

/**
 * Express global error-handling middleware.
 * Must maintain the 4-parameter signature (err, req, res, next) for Express to recognize it.
 *
 * @param {Error} err - The intercepted error instance.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next callback.
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  let statusCode = err.statusCode || err.status || 500;
  let errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
  let message = err.message || "An unexpected error occurred.";
  let details = err.details || null;

  // 1. Handle Known Operational Domain Errors (AppError, ConflictError, etc.)
  if (err instanceof AppError) {
    statusCode = err.statusCode || 400;
    errorCode = err.errorCode || (err.name ? err.name.toUpperCase() : "OPERATIONAL_ERROR");
    message = err.message;
  }
  
  // 2. Handle Repository / Database Errors (Redact SQL in Production)
  else if (err instanceof RepositoryError) {
    statusCode = 500;
    errorCode = "DATABASE_ERROR";
    
    if (isProduction) {
      // Redact low-level database details from production clients
      errorCode = "INTERNAL_SERVER_ERROR";
      message = "An unexpected database error occurred.";
      details = null;
    } else {
      // Expose raw database error context in local development
      details = err.originalError ? err.originalError.message : err.message;
    }
  }
  
  // 3. Handle Unknown / Uncaught Native Javascript Errors
  else {
    statusCode = 500;
    errorCode = "INTERNAL_SERVER_ERROR";
    
    if (isProduction) {
      message = "An unexpected internal server error occurred.";
      details = null;
    }
  }

  // Record and categorize error metrics
  let category = "Unexpected";
  if (err.name === "ValidationError" || (err instanceof AppError && statusCode === 400) || err.message.toLowerCase().includes("validation") || err.message.toLowerCase().includes("limit")) {
    category = "Validation";
  } else if (statusCode === 401 || err.message.toLowerCase().includes("token") || err.message.toLowerCase().includes("auth")) {
    category = "Authentication";
    metrics.increment("authFailures");
    const identifier = req.body?.email || req.ip || "unknown";
    metrics.metricsState.repeatedAuthFailures[identifier] = (metrics.metricsState.repeatedAuthFailures[identifier] || 0) + 1;
  } else if (statusCode === 403 || err.message.toLowerCase().includes("privileges") || err.message.toLowerCase().includes("denied")) {
    category = "Authorization";
  } else if (err instanceof RepositoryError) {
    category = "Repository";
  } else if (err.message.includes("SQLITE") || err.message.toLowerCase().includes("database")) {
    category = "Database";
  } else if (err.message.toLowerCase().includes("storage") || err.message.includes("R2") || err.message.includes("S3")) {
    category = "Storage";
  } else if (err.message.toLowerCase().includes("stripe") || err.message.toLowerCase().includes("payment")) {
    category = "Payment";
  } else if (err.message.toLowerCase().includes("network") || err.message.toLowerCase().includes("timeout") || err.message.includes("ENOTFOUND")) {
    category = "Network";
  }

  metrics.recordError(category);

  // Log error using structured logger
  logger.error({
    event: "ERROR_OCCURRED",
    category,
    message: err.message,
    stack: err.stack,
    statusCode,
    errorCode,
    userId: req.user ? req.user.id : null,
    resourceId: req.params?.publicId || req.params?.id || null,
    severity: "error"
  });

  // 4. Construct Standardized Error Payload Structure
  const responsePayload = {
    success: false,
    error: {
      code: errorCode,
      message,
      details: details !== null ? details : undefined
    }
  };

  // 5. Expose stack trace ONLY in development environments for debugging
  if (!isProduction && err.stack) {
    responsePayload.error.stack = err.stack;
  }

  // Send standardized JSON response
  res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
