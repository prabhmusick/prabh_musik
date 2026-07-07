/**
 * @fileoverview Repository Error Class
 * Custom error class for wrapping low-level database engine/driver failures.
 */

class RepositoryError extends Error {
  /**
   * @param {string} message - User-friendly/generic persistence message.
   * @param {Error|null} originalError - The raw SQLite error context.
   */
  constructor(message, originalError = null) {
    super(message);
    this.name = "RepositoryError";
    this.originalError = originalError;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepositoryError);
    }
  }
}

module.exports = RepositoryError;
