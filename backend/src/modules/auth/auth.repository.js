/**
 * @fileoverview Authentication Repository Layer
 *
 * Responsibilities:
 * - Direct database persistence for credentials, sessions, password reset, and verification tokens.
 * - Handles credential creation and lookup.
 *
 * Explicit Non-Responsibilities:
 * - Does not perform password hashing or validation.
 * - Does not manage JWT token creation or cookie parsing.
 * - Requires explicit transaction handle (tx) for all write operations.
 */

const { db } = require("../../config/db");
const crypto = require("crypto");
const RepositoryError = require("../../errors/RepositoryError");

/**
 * Creates user credentials record.
 * REQUIRES an explicit transaction handle `tx`.
 * Matches signature format: createCredential(tx, credential)
 *
 * @param {import('sqlite3').Database} tx - Required transaction handle.
 * @param {Object} credential - Credential data.
 * @returns {Promise<Object>} Object containing the generated identifier: { id }.
 */
const createCredential = async (tx, credential) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  if (!credential) {
    throw new RepositoryError("Credential data is required.");
  }

  const sql = `
    INSERT INTO user_credentials (
      user_id,
      provider,
      provider_id,
      provider_email,
      password_hash
    ) VALUES (?, ?, ?, ?, ?)
  `;
  const params = [
    credential.user_id,
    credential.provider || "email",
    credential.provider_id || null,
    credential.provider_email || null,
    credential.password_hash || null
  ];

  return new Promise((resolve, reject) => {
    tx.run(sql, params, function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to create credential record: ${err.message}`, err));
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
};

/**
 * Inserts a new session record.
 * REQUIRES an explicit transaction handle `tx`.
 * Matches signature format: createSession(tx, session)
 *
 * @param {import('sqlite3').Database} tx - Required transaction handle.
 * @param {Object} session - Session data.
 * @returns {Promise<Object>} Object containing the session identifier: { id }.
 */
const createSession = async (tx, session) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  if (!session) {
    throw new RepositoryError("Session data is required.");
  }

  const sql = `
    INSERT INTO user_sessions (
      id,
      user_id,
      refresh_token_hash,
      device_name,
      ip,
      user_agent,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    session.id,
    session.user_id,
    session.refresh_token_hash,
    session.device_name || null,
    session.ip || null,
    session.user_agent || null,
    session.expires_at
  ];

  return new Promise((resolve, reject) => {
    tx.run(sql, params, function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to create session record: ${err.message}`, err));
      } else {
        resolve({ id: session.id });
      }
    });
  });
};

/**
 * Updates refresh token hash on a session.
 * REQUIRES an explicit transaction handle `tx`.
 */
const updateSessionRefreshHash = async (tx, sessionId, refreshHash) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }

  const sql = `
    UPDATE user_sessions
    SET refresh_token_hash = ?
    WHERE id = ?
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [refreshHash, sessionId], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to update session refresh token hash: ${err.message}`, err));
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

/**
 * Locates credentials by userId.
 *
 * @param {number} userId - Internal user ID.
 * @param {import('sqlite3').Database|null} tx - Optional transaction handle.
 * @returns {Promise<Object|null>} The credential row.
 */
const findCredentialByUserId = async (userId, tx = null) => {
  const conn = tx || db;
  const sql = `
    SELECT id, user_id, provider, provider_id, provider_email, password_hash, created_at, updated_at
    FROM user_credentials
    WHERE user_id = ? AND provider = 'email'
  `;
  return new Promise((resolve, reject) => {
    conn.get(sql, [userId], (err, row) => {
      if (err) {
        reject(new RepositoryError(`Failed to fetch credentials by User ID: ${err.message}`, err));
      } else {
        resolve(row);
      }
    });
  });
};

/**
 * Locates credentials by user email address.
 *
 * @param {string} email - Normalized user email.
 * @param {import('sqlite3').Database|null} tx - Optional transaction handle.
 * @returns {Promise<Object|null>} The credential row.
 */
const findCredentialByEmail = async (email, tx = null) => {
  const conn = tx || db;
  const sql = `
    SELECT uc.id, uc.user_id, uc.provider, uc.provider_id, uc.provider_email, uc.password_hash, uc.created_at, uc.updated_at
    FROM user_credentials uc
    INNER JOIN users u ON u.id = uc.user_id
    WHERE u.email = ? AND uc.provider = 'email'
  `;
  return new Promise((resolve, reject) => {
    conn.get(sql, [email], (err, row) => {
      if (err) {
        reject(new RepositoryError(`Failed to fetch credentials by email: ${err.message}`, err));
      } else {
        resolve(row);
      }
    });
  });
};

/**
 * Locates an active session record matching a given refresh token.
 */
const findSessionByToken = async (token, tx = null) => {
  const conn = tx || db;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const sql = `
    SELECT 
      id,
      user_id,
      refresh_token_hash,
      device_name,
      ip,
      user_agent,
      created_at,
      last_used_at,
      expires_at,
      revoked_at
    FROM user_sessions
    WHERE refresh_token_hash = ?
  `;
  return new Promise((resolve, reject) => {
    conn.get(sql, [tokenHash], (err, session) => {
      if (err) {
        reject(new RepositoryError(`Failed to fetch session by token: ${err.message}`, err));
      } else if (!session) {
        resolve(null);
      } else {
        resolve({
          id: session.id,
          userId: session.user_id,
          tokenHash: session.refresh_token_hash,
          deviceName: session.device_name,
          ip: session.ip,
          userAgent: session.user_agent,
          createdAt: session.created_at,
          lastUsedAt: session.last_used_at,
          expiresAt: session.expires_at,
          revokedAt: session.revoked_at
        });
      }
    });
  });
};

/**
 * Revokes or deletes a session record.
 * REQUIRES an explicit transaction handle `tx`.
 */
const revokeSession = async (tx, token) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const sql = `
    UPDATE user_sessions
    SET revoked_at = CURRENT_TIMESTAMP, last_used_at = CURRENT_TIMESTAMP
    WHERE refresh_token_hash = ?
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [tokenHash], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to revoke session: ${err.message}`, err));
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

/**
 * Updates the last activity time on an active session.
 * REQUIRES an explicit transaction handle `tx`.
 */
const updateSessionActivity = async (tx, token) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const sql = `
    UPDATE user_sessions
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE refresh_token_hash = ?
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [tokenHash], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to update session activity: ${err.message}`, err));
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

/**
 * Deletes session logs that are past their expiration time or explicitly revoked.
 * REQUIRES an explicit transaction handle `tx`.
 */
const deleteExpiredSessions = async (tx) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  const sql = `
    DELETE FROM user_sessions
    WHERE expires_at < datetime('now') OR revoked_at IS NOT NULL
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to delete expired sessions: ${err.message}`, err));
      } else {
        resolve(this.changes);
      }
    });
  });
};

/**
 * Locates a session record matching a given session ID (UUID).
 *
 * @param {string} sessionId - Session UUID.
 * @param {import('sqlite3').Database|null} tx - Optional transaction handle.
 * @returns {Promise<Object|null>} Mapped user session row details.
 */
const findSessionBySessionId = async (sessionId, tx = null) => {
  const conn = tx || db;
  const sql = `
    SELECT 
      id,
      user_id,
      refresh_token_hash,
      device_name,
      ip,
      user_agent,
      created_at,
      last_used_at,
      expires_at,
      revoked_at
      -- Future Token Family Support:
      -- token_family_id TEXT (Optional UUID grouping session rotations to track replay attacks across families)
    FROM user_sessions
    WHERE id = ?
  `;
  return new Promise((resolve, reject) => {
    conn.get(sql, [sessionId], (err, session) => {
      if (err) {
        reject(new RepositoryError(`Failed to fetch session by Session ID: ${err.message}`, err));
      } else if (!session) {
        resolve(null);
      } else {
        resolve({
          id: session.id,
          userId: session.user_id,
          tokenHash: session.refresh_token_hash,
          deviceName: session.device_name,
          ip: session.ip,
          userAgent: session.user_agent,
          createdAt: session.created_at,
          lastUsedAt: session.last_used_at,
          expiresAt: session.expires_at,
          revokedAt: session.revoked_at
        });
      }
    });
  });
};

/**
 * Updates refresh token hash and activity for a specific session ID (rotation).
 * REQUIRES an explicit transaction handle `tx`.
 *
 * @param {import('sqlite3').Database} tx - Active database transaction context.
 * @param {string} sessionId - Session UUID.
 * @param {string} newRefreshHash - Hex encoded SHA-256 hash of the rotated token.
 * @returns {Promise<boolean>} True if session update succeeded.
 */
const rotateSessionToken = async (tx, sessionId, newRefreshHash) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  const sql = `
    UPDATE user_sessions
    SET refresh_token_hash = ?, last_used_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [newRefreshHash, sessionId], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to rotate session token: ${err.message}`, err));
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

/**
 * Revokes a session record by its Session ID (UUID).
 * REQUIRES an explicit transaction handle `tx`.
 *
 * @param {import('sqlite3').Database} tx - Active database transaction context.
 * @param {string} sessionId - Session UUID.
 * @param {string|null} reason - Optional revocation reason.
 * @returns {Promise<boolean>} True if session revocation succeeded.
 */
const revokeSessionBySessionId = async (tx, sessionId, reason = null) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  const sql = `
    UPDATE user_sessions
    SET revoked_at = CURRENT_TIMESTAMP,
        last_used_at = CURRENT_TIMESTAMP,
        revoked_reason = ?
    WHERE id = ?
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [reason, sessionId], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to revoke session by Session ID: ${err.message}`, err));
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

// ==========================================
// PASSWORD RESET TOKENS
// ==========================================

const createPasswordResetToken = async (tx, userId, token, expiresAt) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  const id = crypto.randomUUID();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const sql = `
    INSERT INTO password_reset_tokens (
      id,
      user_id,
      token_hash,
      expires_at
    ) VALUES (?, ?, ?, ?)
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [id, userId, tokenHash, expiresAt], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to create password reset token: ${err.message}`, err));
      } else {
        resolve({ id, userId, token, expiresAt });
      }
    });
  });
};

const findPasswordResetToken = async (token, tx = null) => {
  const conn = tx || db;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const sql = `
    SELECT 
      id,
      user_id,
      token_hash,
      expires_at,
      used_at,
      created_at
    FROM password_reset_tokens
    WHERE token_hash = ?
  `;
  return new Promise((resolve, reject) => {
    conn.get(sql, [tokenHash], (err, row) => {
      if (err) {
        reject(new RepositoryError(`Failed to fetch password reset token: ${err.message}`, err));
      } else if (!row) {
        resolve(null);
      } else {
        resolve({
          id: row.id,
          userId: row.user_id,
          tokenHash: row.token_hash,
          expiresAt: row.expires_at,
          usedAt: row.used_at,
          createdAt: row.created_at
        });
      }
    });
  });
};

const usePasswordResetToken = async (tx, token) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const sql = `
    UPDATE password_reset_tokens
    SET used_at = CURRENT_TIMESTAMP
    WHERE token_hash = ? AND used_at IS NULL
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [tokenHash], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to mark password reset token as used: ${err.message}`, err));
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

// ==========================================
// EMAIL VERIFICATION TOKENS
// ==========================================

const createEmailVerificationToken = async (tx, userId, token, expiresAt) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  const id = crypto.randomUUID();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const sql = `
    INSERT INTO email_verification_tokens (
      id,
      user_id,
      token_hash,
      expires_at
    ) VALUES (?, ?, ?, ?)
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [id, userId, tokenHash, expiresAt], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to create email verification token: ${err.message}`, err));
      } else {
        resolve({ id, userId, token, expiresAt });
      }
    });
  });
};

const findEmailVerificationToken = async (token, tx = null) => {
  const conn = tx || db;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const sql = `
    SELECT 
      id,
      user_id,
      token_hash,
      expires_at,
      used_at,
      created_at
    FROM email_verification_tokens
    WHERE token_hash = ?
  `;
  return new Promise((resolve, reject) => {
    conn.get(sql, [tokenHash], (err, row) => {
      if (err) {
        reject(new RepositoryError(`Failed to fetch email verification token: ${err.message}`, err));
      } else if (!row) {
        resolve(null);
      } else {
        resolve({
          id: row.id,
          userId: row.user_id,
          tokenHash: row.token_hash,
          expiresAt: row.expires_at,
          usedAt: row.used_at,
          createdAt: row.created_at
        });
      }
    });
  });
};

const useEmailVerificationToken = async (tx, token) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for write operations.");
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const sql = `
    UPDATE email_verification_tokens
    SET used_at = CURRENT_TIMESTAMP
    WHERE token_hash = ? AND used_at IS NULL
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [tokenHash], function (err) {
      if (err) {
        reject(new RepositoryError(`Failed to mark email verification token as used: ${err.message}`, err));
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

module.exports = {
  createCredential,
  createSession,
  updateSessionRefreshHash,
  findCredentialByUserId,
  findCredentialByEmail,
  findSessionByToken,
  revokeSession,
  updateSessionActivity,
  deleteExpiredSessions,
  findSessionBySessionId,
  rotateSessionToken,
  revokeSessionBySessionId,
  createPasswordResetToken,
  findPasswordResetToken,
  usePasswordResetToken,
  createEmailVerificationToken,
  findEmailVerificationToken,
  useEmailVerificationToken
};
