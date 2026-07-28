/**
 * @fileoverview Users Service Layer
 * Coordinates business rules, validation formatting, and resource orchestration for users.
 */

const { ulid } = require("ulid");
const repository = require("./users.repository");
const ConflictError = require("../../errors/ConflictError");

/**
 * Normalizes input details, applies defaults, generates public IDs, and persists the user record.
 *
 * @param {Object} userInput - Validated user profile parameters.
 * @returns {Promise<Object>} The fully created user record.
 * @throws {ConflictError} If the email address is already registered.
 */
const createUser = async (userInput) => {
  // 1. Data Normalization & Sanitization
  const normalizedEmail = userInput.email.trim().toLowerCase();
  const trimmedName = userInput.name.trim();
  const trimmedMobile = userInput.mobile ? userInput.mobile.trim() : null;
  const trimmedAddress = userInput.address ? userInput.address.trim() : null;

  // 2. Generate Domain Identifiers
  // Pattern: usr_<ULID> (e.g. usr_01H7B272Y2E52G9Z5Z5B9D8Y7Z)
  const publicId = `usr_${ulid()}`;

  // 3. Assemble complete User payload with business policy defaults
  const userPayload = {
    public_id: publicId,
    email: normalizedEmail,
    name: trimmedName,
    mobile: trimmedMobile,
    avatar_key: userInput.avatar_key || null,
    address: trimmedAddress,
    role: userInput.role || "customer",
    status: userInput.status || "active"
  };

  try {
    // 4. Delegate to Repository for DB execution
    return await repository.createUser(userPayload);
  } catch (err) {
    // 5. Translate database constraint failures into clear business conflicts
    if (err.message && err.message.includes("users.email")) {
      throw new ConflictError("Email already registered.");
    }
    // Propagate system/operational exceptions unchanged
    throw err;
  }
};

module.exports = {
  createUser
};
