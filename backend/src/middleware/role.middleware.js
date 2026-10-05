const AppError = require("../errors/AppError");
const ERROR_CODES = require("../config/errorCodes");
const { USER_ROLES } = require("../config/constants");

/**
 * Ensures the authenticated user's role is Admin.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware callback.
 * @returns {void}
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    const err = new AppError("Authentication required.", 401);
    err.errorCode = ERROR_CODES.UNAUTHORIZED;
    return next(err);
  }
  if (req.user.role !== USER_ROLES.ADMIN) {
    const err = new AppError("Access denied. Admin privileges required.", 403);
    err.errorCode = ERROR_CODES.FORBIDDEN;
    return next(err);
  }
  next();
};

/**
 * Ensures the user is authenticated.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware callback.
 * @returns {void}
 */
const requireCustomer = (req, res, next) => {
  if (!req.user) {
    const err = new AppError("Authentication required.", 401);
    err.errorCode = ERROR_CODES.UNAUTHORIZED;
    return next(err);
  }
  next();
};

module.exports = {
  requireAdmin,
  requireCustomer
};
