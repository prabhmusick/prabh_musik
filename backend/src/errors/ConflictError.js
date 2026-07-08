/**
 * @fileoverview Conflict Error Class
 * Represents 409 business resource conflict exceptions.
 */

const AppError = require("./AppError");

class ConflictError extends AppError {
  /**
   * @param {string} message - Error description message.
   */
  constructor(message) {
    super(message, 409);
    this.name = "ConflictError";
    this.errorCode = "DUPLICATE_EMAIL";
  }
}

module.exports = ConflictError;
