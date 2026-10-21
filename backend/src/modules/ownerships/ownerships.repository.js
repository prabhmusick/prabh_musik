const { db } = require("../../config/db");
const crypto = require("crypto");
const RepositoryError = require("../../errors/RepositoryError");

const OWNERSHIP_COLUMNS = `
  o.id,
  o.public_id,
  o.user_id,
  o.beat_id,
  o.order_id,
  o.license_type,
  o.purchase_price,
  o.purchase_date,
  o.download_count,
  o.max_downloads,
  o.expires_at,
  o.status,
  o.revoked_at,
  o.download_token,
  o.last_download_at,
  o.created_by_order_status,
  o.created_at,
  o.updated_at,
  u.name AS customer_name,
  u.email AS customer_email,
  b.title AS beat_title,
  b.genre AS beat_genre,
  b.audio_key AS audio_key,
  b.cover_key AS cover_key
`;

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
 * Inserts multiple ownership records into the caller's outer transaction.
 *
 * REQUIRED: tx must be an active transaction context from executeTransaction.
 * All INSERT statements are queued via tx.run() — they are NOT executed here;
 * they are batched atomically with all other statements in the outer tx batch.
 * No internal db.batch() call is made. No this.lastID or this.changes are read.
 *
 * @param {object} tx - Mandatory outer transaction context (from executeFulfillmentTransaction).
 * @param {number} userId - Internal user ID.
 * @param {number} orderId - Internal order ID.
 * @param {Array<object>} items - Mapped ownership items.
 * @returns {Promise<string[]>} Array of pre-generated public_id UUIDs.
 */
const insertOwnershipsTransaction = (tx, userId, orderId, items) => {
  if (!tx || typeof tx.run !== "function") {
    throw new RepositoryError("Transaction context (tx) is required for insertOwnershipsTransaction.");
  }

  const sql = `
    INSERT INTO ownerships (
      public_id,
      user_id,
      beat_id,
      order_id,
      license_type,
      purchase_price,
      max_downloads,
      expires_at,
      download_token,
      status,
      created_by_order_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'paid')
  `;

  const insertedPublicIds = [];

  for (const item of items) {
    const publicId = crypto.randomUUID();
    insertedPublicIds.push(publicId);

    // Queue the INSERT in the outer transaction — does NOT execute immediately.
    // this.lastID and this.changes are NOT read here; the callback is a no-op
    // placeholder required only by the promise wrapper in the repository.
    tx.run(
      sql,
      [
        publicId,
        userId,
        item.beatId,
        orderId,
        item.licenseType,
        item.purchasePrice,
        item.maxDownloads,
        item.expiresAt || null,
        item.downloadToken || null
      ],
      () => {} // no-op: actual execution deferred to batch
    );
  }

  // Return the pre-generated IDs synchronously so callers can use them
  // immediately (e.g. for post-commit lookups after the batch executes).
  return insertedPublicIds;
};

/**
 * Fetches an ownership by ID (joins users and beats)
 */
const getOwnershipById = async (id) => {
  const sql = `
    SELECT 
      ${OWNERSHIP_COLUMNS}
    FROM ownerships o
    JOIN users u ON o.user_id = u.id
    JOIN beats b ON o.beat_id = b.id
    WHERE o.id = ?
  `;
  return get(sql, [id]);
};

/**
 * Fetches active ownership records
 */
const getOwnerships = async () => {
  const sql = `
    SELECT 
      ${OWNERSHIP_COLUMNS}
    FROM ownerships o
    JOIN users u ON o.user_id = u.id
    JOIN beats b ON o.beat_id = b.id
    WHERE o.status = 'active'
    ORDER BY o.created_at DESC
  `;
  return all(sql);
};

/**
 * Fetches active ownerships by user
 */
const getOwnershipsByUser = async (userId) => {
  const sql = `
    SELECT 
      ${OWNERSHIP_COLUMNS}
    FROM ownerships o
    JOIN users u ON o.user_id = u.id
    JOIN beats b ON o.beat_id = b.id
    WHERE o.user_id = ? AND o.status = 'active'
    ORDER BY o.created_at DESC
  `;
  return all(sql, [userId]);
};

/**
 * Fetches active ownerships by beat
 */
const getOwnershipsByBeat = async (beatId) => {
  const sql = `
    SELECT 
      ${OWNERSHIP_COLUMNS}
    FROM ownerships o
    JOIN users u ON o.user_id = u.id
    JOIN beats b ON o.beat_id = b.id
    WHERE o.beat_id = ? AND o.status = 'active'
    ORDER BY o.created_at DESC
  `;
  return all(sql, [beatId]);
};

/**
 * Fetches active ownerships by order
 */
const getOwnershipsByOrder = async (orderId) => {
  const sql = `
    SELECT 
      ${OWNERSHIP_COLUMNS}
    FROM ownerships o
    JOIN users u ON o.user_id = u.id
    JOIN beats b ON o.beat_id = b.id
    WHERE o.order_id = ? AND o.status = 'active'
    ORDER BY o.created_at DESC
  `;
  return all(sql, [orderId]);
};

/**
 * Fetches active ownership by user and beat
 */
const getOwnershipByUserAndBeat = async (userId, beatId) => {
  const sql = `
    SELECT 
      ${OWNERSHIP_COLUMNS}
    FROM ownerships o
    JOIN users u ON o.user_id = u.id
    JOIN beats b ON o.beat_id = b.id
    WHERE o.user_id = ? AND o.beat_id = ? AND o.status = 'active'
    LIMIT 1
  `;
  return get(sql, [userId, beatId]);
};

/**
 * Fetches active ownership by download token
 */
const getOwnershipByDownloadToken = async (token) => {
  const sql = `
    SELECT 
      ${OWNERSHIP_COLUMNS}
    FROM ownerships o
    JOIN users u ON o.user_id = u.id
    JOIN beats b ON o.beat_id = b.id
    WHERE o.download_token = ? AND o.status = 'active'
    LIMIT 1
  `;
  return get(sql, [token]);
};

/**
 * Checks if an active unique record exists
 */
const existsOwnership = async (userId, beatId, orderId) => {
  const sql = `
    SELECT id 
    FROM ownerships 
    WHERE user_id = ? AND beat_id = ? AND order_id = ? AND status = 'active'
    LIMIT 1
  `;
  const row = await get(sql, [userId, beatId, orderId]);
  return !!row;
};

/**
 * Count methods
 */
const countOwnershipsByUser = async (userId) => {
  const sql = `
    SELECT COUNT(*) as count 
    FROM ownerships 
    WHERE user_id = ? AND status = 'active'
  `;
  const row = await get(sql, [userId]);
  return row ? row.count : 0;
};

const countOwnershipsByBeat = async (beatId) => {
  const sql = `
    SELECT COUNT(*) as count 
    FROM ownerships 
    WHERE beat_id = ? AND status = 'active'
  `;
  const row = await get(sql, [beatId]);
  return row ? row.count : 0;
};

/**
 * Increments download count and sets last download time
 */
const incrementDownloadCount = async (id) => {
  const sql = `
    UPDATE ownerships 
    SET 
      download_count = download_count + 1, 
      last_download_at = CURRENT_TIMESTAMP, 
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND status = 'active'
  `;
  const result = await run(sql, [id]);
  return result.changes > 0;
};

/**
 * Updates expiry
 */
const updateExpiry = async (id, expiresAt) => {
  const sql = `
    UPDATE ownerships 
    SET 
      expires_at = ?, 
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND status = 'active'
  `;
  const result = await run(sql, [expiresAt, id]);
  return result.changes > 0;
};

/**
 * Revokes ownership (sets status = 'revoked')
 */
const revokeOwnership = async (id) => {
  const sql = `
    UPDATE ownerships 
    SET 
      status = 'revoked', 
      revoked_at = CURRENT_TIMESTAMP, 
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND status = 'active'
  `;
  const result = await run(sql, [id]);
  return result.changes > 0;
};

/**
 * Executes a single SQL query joining ownerships and beats for paginated customer library.
 */
const getLibraryByUser = async (userId, limit, offset, sortBy, sortOrder) => {
  const sql = `
    SELECT 
      o.id AS ownershipId,
      o.purchase_date AS purchaseDate,
      o.license_type AS licenseType,
      o.download_count AS downloadsUsed,
      o.max_downloads AS maxDownloads,
      o.expires_at AS expiresAt,
      o.status AS status,
      b.id AS beatId,
      b.title AS beatTitle,
      b.cover_key AS beatCoverKey,
      b.bpm AS beatBpm,
      b.genre AS beatGenre
    FROM ownerships o
    JOIN beats b ON o.beat_id = b.id
    WHERE o.user_id = ? AND o.status = 'active'
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  const rows = await all(sql, [userId, limit, offset]);
  return rows.map(row => ({
    ownershipId: row.ownershipId,
    purchaseDate: row.purchaseDate,
    licenseType: row.licenseType,
    downloadsUsed: row.downloadsUsed,
    downloadsRemaining: row.maxDownloads === null ? null : Math.max(0, row.maxDownloads - row.downloadsUsed),
    expiresAt: row.expiresAt,
    status: row.status,
    beat: {
      id: row.beatId,
      title: row.beatTitle,
      coverImage: row.beatCoverKey || null,
      bpm: row.beatBpm,
      genre: row.beatGenre
    }
  }));
};

/**
 * Fetches an ownership by public_id (joins users and beats)
 */
const getOwnershipByPublicId = async (publicId) => {
  const sql = `
    SELECT 
      ${OWNERSHIP_COLUMNS}
    FROM ownerships o
    JOIN users u ON o.user_id = u.id
    JOIN beats b ON o.beat_id = b.id
    WHERE o.public_id = ?
  `;
  return get(sql, [publicId]);
};

module.exports = {
  insertOwnershipsTransaction,
  getOwnershipById,
  getOwnerships,
  getOwnershipsByUser,
  getOwnershipsByBeat,
  getOwnershipsByOrder,
  getOwnershipByUserAndBeat,
  getOwnershipByDownloadToken,
  existsOwnership,
  countOwnershipsByUser,
  countOwnershipsByBeat,
  incrementDownloadCount,
  updateExpiry,
  revokeOwnership,
  getLibraryByUser,
  getOwnershipByPublicId
};
