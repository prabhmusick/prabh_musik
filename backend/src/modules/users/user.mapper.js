/**
 * @fileoverview User Data Mapper
 * Exposes methods to transform database user records into public-facing DTO structures.
 */

/**
 * Maps a database user record to a clean public User DTO.
 *
 * @param {Object} user - The raw database user record.
 * @returns {Object} Clean user DTO containing public details.
 */
const toUserDto = (user) => {
  if (!user) return null;
  return {
    public_id: user.public_id,
    name: user.name,
    email: user.email,
    role: user.role || "customer",
    status: user.status || "active"
  };
};

module.exports = {
  toUserDto
};
