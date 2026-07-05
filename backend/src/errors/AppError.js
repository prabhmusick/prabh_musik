/**
 * Custom Operational Application Error
 * Inherits from Error and adds HTTP statusCode mapping
 */
class AppError extends Error {
  /**
   * @param {string} message - Operational error message description
   * @param {number} [statusCode=400] - Corresponding HTTP status code
   */
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode; // For compatibility across Express router middleware
    this.isOperational = true; // Mark as expected operational error

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
