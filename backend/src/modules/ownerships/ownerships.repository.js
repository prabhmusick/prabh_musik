const { db } = require("../../config/db");

const OWNERSHIP_COLUMNS = `
  o.id,
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
  b.beat_name AS beat_title,
  b.genre AS beat_genre,
  b.audio_key AS audio_key,
  b.cover_key AS cover_key
`;

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
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
        reject(err);
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
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * Inserts multiple ownership records in a single database transaction
 */
const insertOwnershipsTransaction = async (userId, orderId, items, tx) => {
  const sql = `
    INSERT INTO ownerships (
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'paid')
  `;

  if (!tx) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) return reject(err);

          let insertCount = 0;
          if (items.length === 0) {
            db.run("COMMIT", (errCommit) => {
              if (errCommit) {
                db.run("ROLLBACK");
                return reject(errCommit);
              }
              resolve([]);
            });
            return;
          }

          const insertedIds = [];
          let failed = false;

          items.forEach((item) => {
            if (failed) return;
            db.run(
              sql,
              [
                userId,
                item.beatId,
                orderId,
                item.licenseType,
                item.purchasePrice,
                item.maxDownloads,
                item.expiresAt || null,
                item.downloadToken || null
              ],
              function (err2) {
                if (err2) {
                  failed = true;
                  db.run("ROLLBACK");
                  return reject(err2);
                }
                insertedIds.push(this.lastID);
                insertCount++;
                if (insertCount === items.length) {
                  db.run("COMMIT", (errCommit) => {
                    if (errCommit) {
                      db.run("ROLLBACK");
                      return reject(errCommit);
                    }
                    resolve(insertedIds);
                  });
                }
              }
            );
          });
        });
      });
    });
  } else {
    const insertedIds = [];
    for (const item of items) {
      const resultId = await new Promise((resolve, reject) => {
        tx.run(
          sql,
          [
            userId,
            item.beatId,
            orderId,
            item.licenseType,
            item.purchasePrice,
            item.maxDownloads,
            item.expiresAt || null,
            item.downloadToken || null
          ],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
      insertedIds.push(resultId);
    }
    return insertedIds;
  }
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
      b.beat_name AS beatTitle,
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
  getLibraryByUser
};
