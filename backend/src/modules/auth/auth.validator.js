/**
 * @fileoverview Authentication Request Validators
 * Declares validation middleware using modular verification helpers.
 */

const emailUtil = require("../../utils/email");
const passwordPolicy = require("../../utils/passwordPolicy");

/**
 * Validation middleware array for signup requests.
 * Enforces:
 * - name: Required, length [2, 100]
 * - email: Required, valid format, length <= 254
 * - password: Required, length [8, 128], matching passwordPolicy rules
 *
 * @type {Array<import('express').RequestHandler>}
 */
const signup = [
  (req, res, next) => {
    const { email, name, password } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
        errorCode: "INVALID_INPUT",
        details: null
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters.",
        errorCode: "INVALID_INPUT",
        details: null
      });
    }

    // Reject control characters in name
    const hasControlChars = /[\x00-\x1F\x7F-\x9F]/.test(name);
    if (hasControlChars) {
      return res.status(400).json({
        success: false,
        message: "Name cannot contain control characters.",
        errorCode: "INVALID_INPUT",
        details: null
      });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
        errorCode: "INVALID_INPUT",
        details: null
      });
    }

    const normalizedEmail = emailUtil.normalizeEmail(email);
    if (!emailUtil.isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
        errorCode: "INVALID_INPUT",
        details: null
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
        errorCode: "INVALID_INPUT",
        details: null
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Password cannot exceed 128 characters.",
        errorCode: "WEAK_PASSWORD",
        details: null
      });
    }

    if (!passwordPolicy.validatePasswordStrength(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain uppercase, lowercase, numeric, and special characters.",
        errorCode: "WEAK_PASSWORD",
        details: null
      });
    }

    // Attach validated and normalized fields to request body
    req.body.name = trimmedName;
    req.body.email = normalizedEmail;

    next();
  }
];

const login = [
  (req, res, next) => {
    const { email, password } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
        errorCode: "INVALID_INPUT",
        details: null
      });
    }

    const normalizedEmail = emailUtil.normalizeEmail(email);
    if (!emailUtil.isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
        errorCode: "INVALID_INPUT",
        details: null
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
        errorCode: "INVALID_INPUT",
        details: null
      });
    }

    // Attach normalized email
    req.body.email = normalizedEmail;

    next();
  }
];

/**
 * Validation middleware array for forgot password requests.
 *
 * @type {Array<import('express').RequestHandler>}
 */
const forgotPassword = [
  (req, res, next) => {
    next();
  }
];

/**
 * Validation middleware array for reset password requests.
 *
 * @type {Array<import('express').RequestHandler>}
 */
const resetPassword = [
  (req, res, next) => {
    next();
  }
];

/**
 * Validation middleware array for refresh token requests.
 *
 * @type {Array<import('express').RequestHandler>}
 */
const refreshToken = [
  (req, res, next) => {
    const token = req.cookies ? req.cookies.refreshToken : null;
    if (!token || typeof token !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session.",
        errorCode: "INVALID_SESSION",
        requestId: req.id,
        details: null
      });
    }
    next();
  }
];

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  refreshToken
};
