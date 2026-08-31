/**
 * @fileoverview Environment Configuration Module
 * Exports application configuration variables loaded from process.env with default fallback values.
 */

const isProduction = process.env.NODE_ENV === "production";

// Start validations for critical configuration
const missingOrInsecure = [];

const jwtAccess = process.env.JWT_ACCESS_SECRET;
if (isProduction && (!jwtAccess || jwtAccess.includes("change_me") || jwtAccess.length < 32)) {
  missingOrInsecure.push("JWT_ACCESS_SECRET (must be at least 32 characters and non-default in production)");
}

const jwtRefresh = process.env.JWT_REFRESH_SECRET;
if (isProduction && (!jwtRefresh || jwtRefresh.includes("change_me") || jwtRefresh.length < 32)) {
  missingOrInsecure.push("JWT_REFRESH_SECRET (must be at least 32 characters and non-default in production)");
}

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
if (isProduction && !razorpayKeyId) {
  missingOrInsecure.push("RAZORPAY_KEY_ID");
}

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
if (isProduction && !razorpayKeySecret) {
  missingOrInsecure.push("RAZORPAY_KEY_SECRET");
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
if (isProduction && !googleClientId) {
  missingOrInsecure.push("GOOGLE_CLIENT_ID");
}

// Apple sign-in configuration removed. Keep optional var for compatibility but
// do not enforce it in production.
const appleAllowedAudiences = process.env.APPLE_ALLOWED_AUDIENCES || "";

if (missingOrInsecure.length > 0) {
  throw new Error(`CRITICAL CONFIGURATION ERROR: Missing or insecure production variables:\n- ${missingOrInsecure.join("\n- ")}`);
}

const env = {
  /** @type {number} */
  PORT: parseInt(process.env.PORT || "5005", 10),

  /** @type {string} */
  LOG_FORMAT: process.env.LOG_FORMAT || "dev",

  /** @type {string} */
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",

  /** @type {string[]} */
  APPLE_ALLOWED_AUDIENCES: (appleAllowedAudiences || "")
    .split(",")
    .map(aud => aud.trim())
    .filter(Boolean),

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
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true" || isProduction,

  /** @type {string|undefined} */
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,

  /** @type {string} */
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || "lax",

  /** @type {string} */
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",

  /** @type {string} */
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || ""
};

module.exports = env;
