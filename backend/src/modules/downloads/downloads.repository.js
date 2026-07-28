const { db } = require("../../config/db");
const RepositoryError = require("../../errors/RepositoryError");

// Promise wrappers
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(new RepositoryError(`Database run error: ${err.message}`, err));
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(new RepositoryError(`Database get error: ${err.message}`, err));
      } else {
        resolve(row);
      }
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(new RepositoryError(`Database all error: ${err.message}`, err));
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * Creates a new download token mapping.
 */
const createDownloadToken = async (ownershipId, token, expiresAt) => {
  const sql = `
    INSERT INTO download_tokens (
      ownership_id,
      token,
      expires_at
    ) VALUES (?, ?, ?)
  `;
  const result = await run(sql, [ownershipId, token, expiresAt]);
  return result.id;
};

/**
 * Checks for a valid, active unexpired token mapped to an ownership.
 */
const getActiveTokenByOwnership = async (ownershipId) => {
  const sql = `
    SELECT id, ownership_id, token, expires_at, used_at, created_at 
    FROM download_tokens
    WHERE ownership_id = ? AND datetime(expires_at) > datetime('now')
    LIMIT 1
  `;
  return get(sql, [ownershipId]);
};

/**
 * Retrieves download token details.
 */
const getDownloadToken = async (token) => {
  const sql = `
    SELECT id, ownership_id, token, expires_at, used_at, created_at 
    FROM download_tokens
    WHERE token = ?
    LIMIT 1
  `;
  return get(sql, [token]);
};

/**
 * Marks token as used with timestamp.
 */
const markTokenUsed = async (tokenId) => {
  const sql = `
    UPDATE download_tokens 
    SET used_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const result = await run(sql, [tokenId]);
  return result.changes > 0;
};

/**
 * Revokes all active tokens for that ownership.
 */
const revokeTokensByOwnership = async (ownershipId) => {
  const sql = `
    DELETE FROM download_tokens
    WHERE ownership_id = ?
  `;
  const result = await run(sql, [ownershipId]);
  return result.changes > 0;
};

/**
 * Purges expired download tokens from database.
 */
const deleteExpiredTokens = async () => {
  const sql = `
    DELETE FROM download_tokens
    WHERE datetime(expires_at) < datetime('now')
  `;
  const result = await run(sql);
  return result.changes;
};

/**
 * Logs a download access event.
 */
const createDownloadLog = async (logData) => {
  const sql = `
    INSERT INTO download_logs (
      ownership_id,
      token_id,
      ip_address,
      user_agent,
      status
    ) VALUES (?, ?, ?, ?, ?)
  `;
  const result = await run(sql, [
    logData.ownershipId,
    logData.tokenId || null,
    logData.ipAddress || null,
    logData.userAgent || null,
    logData.status
  ]);
  return result.id;
};

/**
 * Gets download logs history list for an ownership.
 */
const getDownloadHistory = async (ownershipId) => {
  const sql = `
    SELECT id, ownership_id, token_id, ip_address, user_agent, status, downloaded_at 
    FROM download_logs
    WHERE ownership_id = ?
    ORDER BY downloaded_at DESC
  `;
  return all(sql, [ownershipId]);
};

/**
 * Returns successful download attempts count.
 */
const getDownloadCount = async (ownershipId) => {
  const sql = `
    SELECT COUNT(*) as count 
    FROM download_logs
    WHERE ownership_id = ? AND status = 'success'
  `;
  const row = await get(sql, [ownershipId]);
  return row ? row.count : 0;
};

/**
 * Gets download logs history list for a customer user.
 */
const getDownloadHistoryByUser = async (userId) => {
  const sql = `
    SELECT dl.id, dl.ownership_id, dl.ip_address, dl.user_agent, dl.status, dl.downloaded_at,
           o.public_id AS ownership_public_id, b.title AS beat_title, b.public_id AS beat_public_id
    FROM download_logs dl
    JOIN ownerships o ON dl.ownership_id = o.id
    JOIN beats b ON o.beat_id = b.id
    WHERE o.user_id = ?
    ORDER BY dl.downloaded_at DESC
  `;
  return all(sql, [userId]);
};

/**
 * Gets all download history for Admin check.
 */
const getAllDownloadHistory = async () => {
  const sql = `
    SELECT dl.id, dl.ownership_id, dl.ip_address, dl.user_agent, dl.status, dl.downloaded_at,
           o.public_id AS ownership_public_id, b.title AS beat_title, b.public_id AS beat_public_id,
           u.email AS user_email, u.name AS user_name
    FROM download_logs dl
    JOIN ownerships o ON dl.ownership_id = o.id
    JOIN beats b ON o.beat_id = b.id
    JOIN users u ON o.user_id = u.id
    ORDER BY dl.downloaded_at DESC
  `;
  return all(sql);
};

/**
 * Gets download logs history specifically for the given ownership public ID for Admin check.
 */
const getDownloadHistoryByPublicId = async (ownershipPublicId) => {
  const sql = `
    SELECT dl.id, dl.ownership_id, dl.ip_address, dl.user_agent, dl.status, dl.downloaded_at,
           o.public_id AS ownership_public_id, b.title AS beat_title, b.public_id AS beat_public_id,
           u.email AS user_email, u.name AS user_name
    FROM download_logs dl
    JOIN ownerships o ON dl.ownership_id = o.id
    JOIN beats b ON o.beat_id = b.id
    JOIN users u ON o.user_id = u.id
    WHERE o.public_id = ?
    ORDER BY dl.downloaded_at DESC
  `;
  return all(sql, [ownershipPublicId]);
};

module.exports = {
  createDownloadToken,
  getActiveTokenByOwnership,
  getDownloadToken,
  markTokenUsed,
  revokeTokensByOwnership,
  deleteExpiredTokens,
  createDownloadLog,
  getDownloadHistory,
  getDownloadCount,
  getDownloadHistoryByUser,
  getAllDownloadHistory,
  getDownloadHistoryByPublicId
};
