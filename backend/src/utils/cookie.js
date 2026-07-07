/**
 * @fileoverview Cookie Helpers Module Skeleton
 * Encapsulates signatures for setting and clearing HTTP-only cookies.
 */

const AppError = require("../errors/AppError");

const getRefreshCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  };
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
  res.clearCookie("refreshToken", {
    path: "/api/auth",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true",
    sameSite: "lax"
  });
};

module.exports = {
  getRefreshCookieOptions,
  setRefreshCookie,
  clearRefreshCookie
};
