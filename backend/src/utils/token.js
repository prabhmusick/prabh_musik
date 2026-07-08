/**
 * @fileoverview Token Cryptographic Utility
 * Encapsulates token hashing and secure verification routines.
 */

const crypto = require("crypto");

/**
 * Hashes a token using SHA-256 and returns the hex digest.
 * @param {string} token - The raw token string.
 * @returns {string} The hashed hex string.
 */
const hashToken = (token) => {
  if (!token) return "";
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Performs a timing-safe comparison of a raw token against a SHA-256 hex hash.
 * @param {string} token - The raw token to compare.
 * @param {string} hash - The target hashed hex string.
 * @returns {boolean} True if they match, false otherwise.
 */
const compareToken = (token, hash) => {
  if (!token || !hash) return false;
  
  const computedHash = hashToken(token);
  const hashBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");

  if (hashBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, hashBuffer);
};

module.exports = {
  hashToken,
  compareToken
};
