/**
 * @fileoverview Unique ID Generation Utility
 * Encapsulates Node's crypto randomUUID function for service layer decoupling.
 */

const crypto = require("crypto");

/**
 * Generates a unique public user identifier.
 * @returns {string} A v4 UUID string.
 */
const generatePublicId = () => {
  return crypto.randomUUID();
};

/**
 * Generates a unique session identifier.
 * @returns {string} A v4 UUID string.
 */
const generateSessionId = () => {
  return crypto.randomUUID();
};

module.exports = {
  generatePublicId,
  generateSessionId
};
