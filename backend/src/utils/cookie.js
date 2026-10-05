/**
 * @fileoverview Cookie Helpers Module Skeleton
 * Encapsulates signatures for setting and clearing HTTP-only cookies.
 */

const AppError = require("../errors/AppError");

const getRefreshCookieOptions = () => {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "true";
  const secure = isProduction || process.env.COOKIE_SECURE === "true";
  const sameSite = (
    process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax")
  ).toLowerCase();
  const path = process.env.COOKIE_PATH || "/";
  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  };

  if (
    process.env.COOKIE_DOMAIN &&
    process.env.COOKIE_DOMAIN.trim() &&
    process.env.COOKIE_DOMAIN.trim() !== "localhost"
  ) {
    options.domain = process.env.COOKIE_DOMAIN.trim();
  }

  return options;
};

/**
 * Attaches the refresh token HTTP-only cookie to the response object.
 *
 * @param {import('express').Response} res - The Express response object.
 * @param {string} token - The signed refresh token.
 * @returns {void}
 */
const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, getRefreshCookieOptions());
};

/**
 * Clears the refresh token HTTP-only cookie from the response.
 *
 * @param {import('express').Response} res - The Express response object.
 * @returns {void}
 */
const clearRefreshCookie = (res) => {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "true";
  const options = {
    path: process.env.COOKIE_PATH || "/",
    httpOnly: true,
    secure: isProduction || process.env.COOKIE_SECURE === "true",
    sameSite: (
      process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax")
    ).toLowerCase(),
  };

  if (
    process.env.COOKIE_DOMAIN &&
    process.env.COOKIE_DOMAIN.trim() &&
    process.env.COOKIE_DOMAIN.trim() !== "localhost"
  ) {
    options.domain = process.env.COOKIE_DOMAIN.trim();
  }

  res.clearCookie("refreshToken", options);
};

module.exports = {
  getRefreshCookieOptions,
  setRefreshCookie,
  clearRefreshCookie,
};
