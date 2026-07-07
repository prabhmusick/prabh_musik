/**
 * @fileoverview Authentication Payload Utility Skeleton
 * Defines the standard mapping structure for auth payloads.
 */

const AppError = require("../errors/AppError");

/**
 * Constructs a standard payload format for access and refresh tokens.
 *
 * @param {Object} user - The database user object.
 * @param {number|string} user.id - The unique identifier of the user (maps to sub).
 * @param {string} user.role - The role of the user.
 * @param {string|null} [sessionId=null] - The optional session identifier (maps to sid).
 * @returns {{sub: (number|string), role: string, sid: (string|null)}} The minimal payload object.
 * @throws {AppError} Not implemented error (501).
 */
const buildAccessPayload = (user) => {
  throw new AppError("Not implemented", 501);
};

module.exports = {
  buildAccessPayload
};
