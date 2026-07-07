/**
 * @fileoverview Role-Based Authorization Middleware Skeleton
 * Declares checks to gate access based on authorization status.
 */

const AppError = require("../errors/AppError");

/**
 * Ensures the authenticated user's role is Admin.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware callback.
 * @returns {void}
 * @throws {AppError} Not implemented error (501).
 */
const requireAdmin = (req, res, next) => {
  return next(new AppError("Not implemented", 501));
};

/**
 * Ensures the authenticated user's role is Customer.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware callback.
 * @returns {void}
 * @throws {AppError} Not implemented error (501).
 */
const requireCustomer = (req, res, next) => {
  return next(new AppError("Not implemented", 501));
};

module.exports = {
  requireAdmin,
  requireCustomer
};
