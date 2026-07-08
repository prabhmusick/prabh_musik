/**
 * @fileoverview Password Cryptography Utilities
 * Provides password hashing and matching interface using bcrypt.
 */

const bcrypt = require("bcrypt");

/**
 * Hashes a plaintext password string asynchronously using bcrypt (saltRounds = 12).
 *
 * @param {string} password - The plaintext password to hash.
 * @returns {Promise<string>} The hashed password string.
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

/**
 * Compares a plaintext password with a database-retrieved hashed password.
 *
 * @param {string} password - The plaintext password.
 * @param {string} hashedPassword - The hashed password.
 * @returns {Promise<boolean>} Resolves to true if passwords match, otherwise false.
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword
};
