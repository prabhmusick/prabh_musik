/**
 * @fileoverview Authentication Router
 * Maps Express routes to corresponding request validators and controller actions.
 */

const express = require("express");
const controller = require("./auth.controller");
const validator = require("./auth.validator");
const catchAsync = require("../../utils/catchAsync");
const authMiddleware = require("../../middleware/auth.middleware");
const { rateLimit } = require("../../middleware/rateLimit.middleware");

const router = express.Router();

const signupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many registration attempts from this IP, please try again after 15 minutes."
});

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many login attempts from this IP, please try again after 15 minutes."
});

// Email registration and authentication
router.post("/signup", signupRateLimiter, validator.signup, catchAsync(controller.signup));
router.post("/login", loginRateLimiter, validator.login, catchAsync(controller.login));
router.post("/logout", catchAsync(controller.logout));
router.post("/refresh", validator.refreshToken, catchAsync(controller.refreshToken));

// Current session context (requires authentication)
router.get("/me", authMiddleware, catchAsync(controller.getMe));

// Account recovery settings
router.post("/forgot-password", validator.forgotPassword, catchAsync(controller.forgotPassword));
router.post("/reset-password", validator.resetPassword, catchAsync(controller.resetPassword));

// Account verification settings
router.get("/verify-email", catchAsync(controller.verifyEmail));
router.post("/resend-verification", catchAsync(controller.resendVerification));

// Federated Identity OAuth Providers
router.post("/google", catchAsync(controller.googleLogin));
router.post("/apple", catchAsync(controller.appleLogin));

module.exports = router;
