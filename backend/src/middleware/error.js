/**
 * @fileoverview Standardized Global Error Handler Middleware
 * Intercepts all application rejections and standardizes error responses.
 */

const logger = require("../utils/logger");
const ERROR_CODES = require("../config/errorCodes");

/**
 * Express error handler middleware.
 *
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware callback.
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const requestId = req.id || null;

  let statusCode = err.statusCode || err.status || 500;
  let errorCode = err.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;

  const isOperational = err.isOperational === true;

  if (!isOperational) {
    // Redact internal stack traces and SQLite errors in production
    statusCode = 500;
    errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;

    // Log the true unexpected system exception internally
    logger.error({
      event: "UNEXPECTED_SYSTEM_ERROR",
      requestId,
      message: err.message,
      stack: err.stack
    });

    message = "An unexpected error occurred.";
    details = null;
  } else {
    // Log operational business errors as warnings
    logger.warn({
      event: "OPERATIONAL_BUSINESS_ERROR",
      requestId,
      statusCode,
      errorCode,
      message,
      details
    });
  }

  const responsePayload = {
    success: false,
    message,
    errorCode,
    requestId,
    details
  };

  // Expose stack trace only outside production for debugging
  if (!isProduction && !isOperational) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
