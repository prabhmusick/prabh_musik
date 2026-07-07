/**
 * @fileoverview Environment Configuration Module
 * Exports application configuration variables loaded from process.env with default fallback values.
 */

const env = {
  /** @type {number} */
  PORT: parseInt(process.env.PORT || "5005", 10),

  /** @type {string} */
  LOG_FORMAT: process.env.LOG_FORMAT || "dev",

  /** @type {string} */
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "prabh_musik_access_secret_key_change_me_in_prod",

  /** @type {string} */
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "prabh_musik_refresh_secret_key_change_me_in_prod",

  /** @type {string} */
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "15m",

  /** @type {string} */
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "30d",

  /** @type {number} */
  ACCESS_TOKEN_EXPIRY_SECONDS: parseInt(process.env.ACCESS_TOKEN_EXPIRY_SECONDS || "900", 10),

  /** @type {number} */
  SESSION_EXPIRY_DAYS: parseInt(process.env.SESSION_EXPIRY_DAYS || "30", 10),

  /** @type {boolean} */
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",

  /** @type {string|undefined} */
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,

  /** @type {string} */
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || "lax"
};

module.exports = env;
