/**
 * @fileoverview Email Utility Module
 * Exposes reusable functions for email verification and normalization.
 */

/**
 * Normalizes an email address by trimming whitespace and lowercasing it.
 *
 * @param {string} email - The raw email address string.
 * @returns {string} The normalized email address.
 */
const normalizeEmail = (email) => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

/**
 * Validates whether an email has a correct format and complies with length limits.
 *
 * @param {string} email - The normalized or raw email address string.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
const isValidEmail = (email) => {
  if (typeof email !== "string") return false;
  if (email.length > 254) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  normalizeEmail,
  isValidEmail
};
