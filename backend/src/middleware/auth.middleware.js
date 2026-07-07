/**
 * @fileoverview Authentication Middleware Skeleton
 * Declares the validation and authorization request context mapping interface.
 */

const AppError = require("../errors/AppError");
const jwtUtil = require("../utils/jwt");
const ERROR_CODES = require("../config/errorCodes");

/**
 * Authentication validation middleware.
 * Verifies Bearer Access Token in Authorization header.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware callback.
 * @returns {void}
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new AppError("Authentication token is missing or invalid.", 401);
    err.errorCode = ERROR_CODES.UNAUTHORIZED;
    return next(err);
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwtUtil.verifyAccessToken(token);
    if (!decoded || !decoded.sub) {
      const err = new AppError("Authentication token is missing or invalid.", 401);
      err.errorCode = ERROR_CODES.UNAUTHORIZED;
      return next(err);
    }
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      sessionId: decoded.sid
    };
    next();
  } catch (error) {
    const err = new AppError("Authentication token is missing or invalid.", 401);
    err.errorCode = ERROR_CODES.UNAUTHORIZED;
    return next(err);
  }
};

module.exports = authMiddleware;
