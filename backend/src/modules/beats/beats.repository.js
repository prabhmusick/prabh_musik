const { db } = require("../../config/db");
const crypto = require("crypto");

// ==========================================
// Constants & SQL Segments
// ==========================================

// Explicit list of columns to retrieve (never use SELECT *)
const BEAT_COLUMNS = `
  id,
  public_id,
  beat_name,
  slug,
  beat_type,
  price,
  genre,
  bpm,
  description,
  audio_key,
  cover_key,
  banner_key,
  duration,
  track_type,
  mood,
  selling_status,
  status,
  created_at,
  updated_at
`;

// Extracted updatable fields array to avoid re-creation on every request
const UPDATABLE_FIELDS = [
  "beat_name",
  "slug",
  "beat_type",
  "price",
  "genre",
  "bpm",
  "description",
  "audio_key",
  "cover_key",
  "banner_key",
  "duration",
  "track_type",
  "mood",
  "selling_status",
  "status"
];

// ==========================================
// Promise Wrappers for SQLite3 Callbacks
// ==========================================

/**
 * Executes a write statement (INSERT, UPDATE, DELETE)
 * 
 * @param {string} sql - SQL query command
 * @param {Array} params - Query parameters
 * @returns {Promise<{id: number, changes: number}>} Last inserted row ID and changes count
 */
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

/**
 * Retrieves a single row from database
 * 
 * @param {string} sql - SQL query command
 * @param {Array} params - Query parameters
 * @returns {Promise<object|undefined>} Database row object or undefined
 */
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

/**
 * Retrieves all matching rows from database
 * 
 * @param {string} sql - SQL query command
 * @param {Array} params - Query parameters
 * @returns {Promise<Array<object>>} List of database row objects
 */
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

// ==========================================
// Repository Exports
// ==========================================

/**
 * Fetches a single beat record by its ID using explicit columns.
 * Excludes archived beats.
 * 
 * @param {number|string} id - Beat ID
 * @returns {Promise<object|undefined>} Plain database beat record object
 */
const getBeatById = async (id) => {
  const sql = `
    SELECT 
      ${BEAT_COLUMNS}
    FROM beats 
    WHERE (id = ? OR public_id = ?) 
      AND status != 'archived'
  `;
  return get(sql, [id, id]);
};

/**
 * Checks if a specific SEO slug is already registered and active in the database.
 * 
 * @param {string} slug - Beat SEO slug to verify
 * @returns {Promise<boolean>} True if slug exists, false otherwise
 */
const existsBySlug = async (slug) => {
  const sql = `
    SELECT id 
    FROM beats 
    WHERE slug = ?
  `;
  const row = await get(sql, [slug]);
  return !!row;
};

/**
 * Creates a new beat record in the database and returns its row ID.
 * Defaults are handled entirely in the service layer.
 * 
 * @param {object} beat - Beat properties
 * @returns {Promise<number>} The newly created beat record row ID
 */
const createBeat = async (beat) => {
  const publicId = crypto.randomUUID();
  const sql = `
    INSERT INTO beats (
      public_id,
      beat_name,
      slug,
      beat_type,
      price,
      genre,
      bpm,
      description,
      audio_key,
      cover_key,
      banner_key,
      duration,
      track_type,
      mood,
      selling_status,
      status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `;

  const params = [
    publicId,
    beat.beat_name,
    beat.slug,
    beat.beat_type,
    beat.price,
    beat.genre,
    beat.bpm,
    beat.description,
    beat.audio_key,
    beat.cover_key,
    beat.banner_key,
    beat.duration,
    beat.track_type,
    beat.mood,
    beat.selling_status,
    beat.status
  ];

  const result = await run(sql, params);
  return result.id;
};

/**
 * Fetches all beat records ordered by creation date descending (excludes archived beats)
 * 
 * @returns {Promise<Array<object>>} List of beat records
 */
const getAllBeats = async () => {
  const sql = `
    SELECT 
      ${BEAT_COLUMNS}
    FROM beats 
    WHERE status != 'archived'
    ORDER BY created_at DESC
  `;
  return all(sql);
};

/**
 * Fetches paginated & filtered beat records using SQL parameters.
 */
const getBeatsPaginated = async ({
  page = 1,
  limit = 20,
  search = "",
  genre = null,
  mood = null,
  minPrice = null,
  maxPrice = null,
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ["status != 'archived'"];
  const params = [];

  if (search && String(search).trim()) {
    conditions.push("(beat_name LIKE ? OR genre LIKE ? OR mood LIKE ?)");
    const term = `%${String(search).trim()}%`;
    params.push(term, term, term);
  }

  if (genre && String(genre).trim()) {
    conditions.push("genre = ?");
    params.push(String(genre).trim());
  }

  if (mood && String(mood).trim()) {
    conditions.push("mood = ?");
    params.push(String(mood).trim());
  }

  if (minPrice !== null && minPrice !== undefined && minPrice !== "" && !isNaN(minPrice)) {
    conditions.push("price >= ?");
    params.push(Number(minPrice));
  }

  if (maxPrice !== null && maxPrice !== undefined && maxPrice !== "" && !isNaN(maxPrice)) {
    conditions.push("price <= ?");
    params.push(Number(maxPrice));
  }

  const whereClause = conditions.join(" AND ");

  const countSql = `SELECT COUNT(*) as total FROM beats WHERE ${whereClause}`;
  const countRow = await get(countSql, params);
  const total = countRow ? countRow.total : 0;
  const totalPages = Math.ceil(total / limitNum);

  const dataSql = `
    SELECT 
      ${BEAT_COLUMNS}
    FROM beats 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const data = await all(dataSql, [...params, limitNum, offset]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
  };
};

/**
 * Updates properties of a beat record dynamically
 * 
 * @param {number|string} id - Beat ID to update
 * @param {object} beat - Properties to modify
 * @returns {Promise<boolean>} True if database records were modified
 */
const updateBeat = async (id, beat) => {
  const fields = [];
  const params = [];

  UPDATABLE_FIELDS.forEach((field) => {
    if (beat[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(beat[field]);
    }
  });

  if (fields.length === 0) {
    return false;
  }

  // Force update the updated_at timestamp field
  fields.push("updated_at = CURRENT_TIMESTAMP");

  // Append ID for the WHERE clause parameter binding
  params.push(id);

  const sql = `
    UPDATE beats
    SET 
      ${fields.join(",\n      ")}
    WHERE id = ?
  `;

  const result = await run(sql, params);
  return result.changes > 0;
};

/**
 * Soft deletes a beat record by setting its status to 'archived'
 * 
 * @param {number|string} id - Beat ID
 * @returns {Promise<boolean>} True if record was modified, false otherwise
 */
const archiveBeat = async (id) => {
  const sql = `
    UPDATE beats 
    SET 
      status = 'archived',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const result = await run(sql, [id]);
  return result.changes > 0;
};

/**
 * Updates selling_status of a beat, optionally using transaction context tx
 */
const updateSellingStatus = async (beatId, sellingStatus, tx) => {
  const sql = `
    UPDATE beats
    SET 
      selling_status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const conn = tx || db;
  return new Promise((resolve, reject) => {
    conn.run(sql, [sellingStatus, beatId], function (err) {
      if (err) reject(err);
      else resolve(this.changes > 0);
    });
  });
};

module.exports = {
  createBeat,
  getBeatById,
  existsBySlug,
  getAllBeats,
  getBeatsPaginated,
  updateBeat,
  archiveBeat,
  updateSellingStatus
};
