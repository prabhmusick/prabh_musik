/**
 * @fileoverview Users Repository Layer
 *
 * Responsibilities:
 * - Direct database persistence for the "users" table.
 * - Handles user profile creation and email/ID lookup.
 *
 * Explicit Non-Responsibilities:
 * - Does not manage user authentication credentials or passwords (moved to auth.repository).
 * - Does not perform password hashing or business-rule validation.
 * - Does not run write operations without an explicit transaction context.
 */

const { db } = require("../../config/db");
const crypto = require("crypto");
const RepositoryError = require("../../errors/RepositoryError");

// Columns from the users table only
const USER_COLUMNS = `
  u.id,
  u.public_id,
  u.name,
  u.mobile,
  u.email,
  u.role,
  u.status,
  u.address,
  0 AS beats_buy,
  u.created_at AS user_created_date,
  NULL AS last_purchase_date,
  u.last_login_at AS last_login_time,
  u.created_at,
  u.updated_at,
  u.last_login_at
`;

/**
 * Fetches a single user record by its internal numeric ID.
 *
 * @param {number} id - Internal database ID.
 * @param {import('sqlite3').Database|null} tx - Optional transaction handle.
 * @returns {Promise<Object|null>} The user profile object.
 */
const getUserById = async (id, tx = null) => {
  const conn = tx || db;
  const sql = `
    SELECT 
      ${USER_COLUMNS}
    FROM users u 
    WHERE u.id = ?
  `;
  return new Promise((resolve, reject) => {
    conn.get(sql, [id], (err, row) => {
      if (err) {
        reject(new RepositoryError(`Failed to fetch user by ID: ${err.message}`, err));
      } else {
        resolve(row);
      }
    });
  });
};

/**
 * Finds a user profile by their normalized email address.
 *
 * @param {string} email - The normalized email address.
 * @param {import('sqlite3').Database|null} tx - Optional transaction handle.
 * @returns {Promise<Object|null>} The user profile object.
 */
const findUserByEmail = async (email, tx = null) => {
  const conn = tx || db;
  const sql = `
    SELECT 
      ${USER_COLUMNS}
    FROM users u 
    WHERE u.email = ?
  `;
  return new Promise((resolve, reject) => {
    conn.get(sql, [email], (err, row) => {
      if (err) {
        reject(new RepositoryError(`Failed to fetch user by email: ${err.message}`, err));
      } else {
        resolve(row);
      }
    });
  });
};

// Compatibility alias
const getUserByEmail = findUserByEmail;

/**
 * Creates a new user record.
 * REQUIRES an explicit transaction handle `tx`.
 *
 * @param {import('sqlite3').Database} tx - Required transaction handle.
 * @param {Object} user - The user registration data.
 * @returns {Promise<Object>} Object containing the generated identifiers: { id, public_id }.
 */
const createUser = async (tx, user) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  if (!user) {
    throw new RepositoryError("User data object is required to insert user profile.");
  }

  const publicId = user.public_id || crypto.randomUUID();
  const sql = `
    INSERT INTO users (
      public_id,
      name,
      mobile,
      email,
      role,
      status,
      address
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    publicId,
    user.name,
    user.mobile || null,
    user.email,
    user.role || "customer",
    user.status || "active",
    user.address || null
  ];

  return new Promise((resolve, reject) => {
    tx.run(sql, params, function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to create user record: ${err.message}`, err));
      } else {
        resolve({
          id: this.lastID,
          public_id: publicId
        });
      }
    });
  });
};

/**
 * Fetches all user records ordered by creation date descending.
 *
 * @returns {Promise<Array>} List of user rows.
 */
const getAllUsers = async () => {
  const sql = `
    SELECT 
      ${USER_COLUMNS}
    FROM users u 
    ORDER BY u.created_at DESC
  `;
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(new RepositoryError(`Failed to fetch all users: ${err.message}`, err));
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * Updates user profile details (Legacy wrapper).
 */
const updateUser = async (id, user) => {
  throw new RepositoryError("Direct updateUser execution without unified service is deprecated.");
};

/**
 * Updates a user's last_login_at timestamp.
 * REQUIRES an explicit transaction handle `tx`.
 *
 * @param {import('sqlite3').Database} tx - Required transaction handle.
 * @param {number} userId - Internal user ID.
 * @param {string} timestamp - ISO-8601 formatted date string.
 * @returns {Promise<boolean>} Resolves with true if successfully updated.
 */
const updateLastLoginAt = async (tx, userId, timestamp) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  const sql = `
    UPDATE users
    SET last_login_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [timestamp, userId], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to update last_login_at: ${err.message}`, err));
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

/**
 * Locates a user record matching a given public UUID.
 *
 * @param {string} publicId - User public UUID.
 * @param {import('sqlite3').Database|null} tx - Optional transaction handle.
 * @returns {Promise<Object|null>} Mapped user profile row.
 */
const findUserByPublicId = async (publicId, tx = null) => {
  const conn = tx || db;
  const sql = `
    SELECT 
      ${USER_COLUMNS}
    FROM users u
    WHERE u.public_id = ?
  `;
  return new Promise((resolve, reject) => {
    conn.get(sql, [publicId], (err, row) => {
      if (err) {
        reject(new RepositoryError(`Failed to fetch user by public ID: ${err.message}`, err));
      } else {
        resolve(row || null);
      }
    });
  });
};

const getUserByPublicId = findUserByPublicId;

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  findUserByEmail,
  getAllUsers,
  updateUser,
  updateLastLoginAt,
  findUserByPublicId,
  getUserByPublicId
};
