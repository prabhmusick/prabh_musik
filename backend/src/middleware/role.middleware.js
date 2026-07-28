/**
 * @fileoverview Role-Based Authorization Middleware Skeleton
 * Declares checks to gate access based on authorization status.
 */

const AppError = require("../errors/AppError");
const ERROR_CODES = require("../config/errorCodes");

/**
 * Ensures the authenticated user's role is Admin.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware callback.
 * @returns {void}
 * @throws {AppError} Forbidden error (403).
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    const err = new AppError("Access denied. Administrator privileges required.", 403);
    err.errorCode = ERROR_CODES.FORBIDDEN;
    return next(err);
  }
  next();
};

/**
 * Ensures the authenticated user's role is Customer.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware callback.
 * @returns {void}
 * @throws {AppError} Forbidden error (403).
 */
const requireCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== "customer") {
    const err = new AppError("Access denied. Customer privileges required.", 403);
    err.errorCode = ERROR_CODES.FORBIDDEN;
    return next(err);
  }
  next();
};

module.exports = {
  requireAdmin,
  requireCustomer
};
