/**
 * @fileoverview JWT Utility Module
 * Wraps jsonwebtoken API signatures for access and refresh tokens.
 */

const jwt = require("jsonwebtoken");

/**
 * Generates a short-lived JWT access token using the HS256 algorithm.
 *
 * @param {Object} payload - The token payload.
 * @returns {string} The signed JWT access token.
 */
const generateAccessToken = (payload) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured in environment variables.");
  }
  return jwt.sign(payload, secret, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m"
  });
};

/**
 * Verifies a JWT access token's signature and expiration.
 *
 * @param {string} token - The access token to verify.
 * @returns {Object} The decoded payload if verification succeeds.
 */
const verifyAccessToken = (token) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured in environment variables.");
  }
  return jwt.verify(token, secret);
};

/**
 * Generates a long-lived JWT refresh token using the HS256 algorithm.
 *
 * @param {Object} payload - The token payload.
 * @returns {string} The signed JWT refresh token.
 */
const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured in environment variables.");
  }
  return jwt.sign(payload, secret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "30d"
  });
};

/**
 * Verifies a JWT refresh token's signature and expiration.
 *
 * @param {string} token - The refresh token to verify.
 * @returns {Object} The decoded payload if verification succeeds.
 */
const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured in environment variables.");
  }
  return jwt.verify(token, secret);
};

/**
 * Decodes a JWT token without checking its signature or expiration status.
 *
 * @param {string} token - The JWT token to decode.
 * @returns {Object|null} The decoded token payload/header structure.
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken
};
