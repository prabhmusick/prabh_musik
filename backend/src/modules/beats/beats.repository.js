/**
 * @fileoverview Beats Repository Layer
 * Handles database persistence operations for the "beats" table using Cloudflare D1 prepared statements.
 */

const { db } = require("../../config/db");
const RepositoryError = require("../../errors/RepositoryError");

/**
 * Explicit list of columns to retrieve (never use SELECT *)
 */
const BEAT_COLUMNS = `
  id,
  public_id,
  title,
  slug,
  price_amount,
  currency_code,
  genre,
  bpm,
  musical_key,
  description,
  audio_key,
  cover_key,
  banner_key,
  duration,
  status,
  created_by,
  created_at,
  updated_at
`;

/**
 * Whitelist of allowed sorting columns for list queries to prevent SQL Injection.
 */
const ALLOWED_SORT_COLUMNS = {
  created_at: "created_at",
  title: "title",
  price_amount: "price_amount"
};

/**
 * Whitelist of allowed sorting directions.
 */
const ALLOWED_SORT_ORDERS = {
  ASC: "ASC",
  DESC: "DESC"
};

/**
 * Whitelist of allowed updatable columns for beats to prevent unauthorized column modifications.
 */
const UPDATABLE_COLUMNS = {
  title: "title",
  slug: "slug",
  price_amount: "price_amount",
  currency_code: "currency_code",
  genre: "genre",
  bpm: "bpm",
  musical_key: "musical_key",
  description: "description",
  audio_key: "audio_key",
  cover_key: "cover_key",
  banner_key: "banner_key",
  duration: "duration",
  status: "status"
};

/**
 * Inserts a new beat record into the database and retrieves the complete row using its public_id.
 *
 * @param {Object} beatData - Fully prepared beat data object from the Service layer.
 * @returns {Promise<Object>} The freshly created beat record.
 * @throws {RepositoryError} If database insertion or retrieval fails.
 */
const createBeat = async (beatData) => {
  const insertSql = `
    INSERT INTO beats (
      public_id,
      title,
      slug,
      price_amount,
      currency_code,
      genre,
      bpm,
      musical_key,
      description,
      audio_key,
      cover_key,
      banner_key,
      duration,
      status,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    beatData.public_id,
    beatData.title,
    beatData.slug,
    beatData.price_amount,
    beatData.currency_code,
    beatData.genre,
    beatData.bpm,
    beatData.musical_key,
    beatData.description,
    beatData.audio_key,
    beatData.cover_key,
    beatData.banner_key,
    beatData.duration,
    beatData.status,
    beatData.created_by
  ];

  try {
    // 1. Execute the insert mutation using D1 prepared statements
    await db.prepare(insertSql).bind(...params).run();

    // 2. Retrieve the inserted row using the stable, globally unique public_id
    const selectSql = `
      SELECT 
        ${BEAT_COLUMNS}
      FROM beats 
      WHERE public_id = ?
    `;

    const createdBeat = await db.prepare(selectSql).bind(beatData.public_id).first();
    if (!createdBeat) {
      throw new RepositoryError("Beat record was inserted successfully, but retrieval failed.");
    }

    return createdBeat;
  } catch (err) {
    if (err instanceof RepositoryError) {
      throw err;
    }
    // Wrap database driver failures to isolate repository concerns
    throw new RepositoryError(`Failed to insert beat record: ${err.message}`, err);
  }
};

/**
 * Locates a single beat record matching the given public_id.
 *
 * @param {string} publicId - Public ULID identifier (bt_...).
 * @returns {Promise<Object|null>} The raw beat record if found, or null if no matching record exists.
 * @throws {RepositoryError} If database query execution fails.
 */
const findByPublicId = async (publicId) => {
  const sql = `
    SELECT 
      ${BEAT_COLUMNS}
    FROM beats 
    WHERE public_id = ?
  `;

  try {
    const beat = await db.prepare(sql).bind(publicId).first();
    return beat || null;
  } catch (err) {
    if (err instanceof RepositoryError) {
      throw err;
    }
    throw new RepositoryError(`Failed to fetch beat by public ID: ${err.message}`, err);
  }
};

/**
 * Locates a single beat record matching the given SEO slug.
 *
 * @param {string} slug - Unique SEO URL slug (e.g., "midnight-drive").
 * @returns {Promise<Object|null>} The raw beat record if found, or null if no matching record exists.
 * @throws {RepositoryError} If database query execution fails.
 */
const findBySlug = async (slug) => {
  const sql = `
    SELECT 
      ${BEAT_COLUMNS}
    FROM beats 
    WHERE slug = ?
  `;

  try {
    const beat = await db.prepare(sql).bind(slug).first();
    return beat || null;
  } catch (err) {
    if (err instanceof RepositoryError) {
      throw err;
    }
    throw new RepositoryError(`Failed to fetch beat by slug: ${err.message}`, err);
  }
};

/**
 * Checks whether a beat record exists with the given SEO slug.
 *
 * @param {string} slug - Unique SEO URL slug to verify.
 * @returns {Promise<boolean>} True if matching beat row exists, false otherwise.
 * @throws {RepositoryError} If database query execution fails.
 */
const existsBySlug = async (slug) => {
  const sql = `
    SELECT 1 
    FROM beats 
    WHERE slug = ? 
    LIMIT 1
  `;

  try {
    const row = await db.prepare(sql).bind(slug).first();
    return !!row;
  } catch (err) {
    if (err instanceof RepositoryError) {
      throw err;
    }
    throw new RepositoryError(`Failed to verify beat slug existence: ${err.message}`, err);
  }
};

/**
 * Retrieves a paginated and filtered list of beat records.
 *
 * @param {Object} [options={}] - Query options.
 * @param {string} [options.status] - Filter by workflow status ('published', 'draft', 'archived').
 * @param {string} [options.genre] - Filter by genre.
 * @param {number} [options.limit=20] - Page size limit.
 * @param {number} [options.offset=0] - Page offset.
 * @param {string} [options.sortBy='created_at'] - Column name to sort by.
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction.
 * @returns {Promise<Array<Object>>} Array of matching beat records, or empty array if none match.
 * @throws {RepositoryError} If database query execution fails.
 */
const listBeats = async (options = {}) => {
  const {
    status,
    genre,
    limit = 20,
    offset = 0,
    sortBy = "created_at",
    sortOrder = "DESC"
  } = options;

  const whereConditions = [];
  const params = [];

  // 1. Dynamically build WHERE clause conditions
  if (status !== undefined && status !== null) {
    whereConditions.push("status = ?");
    params.push(status);
  }

  if (genre !== undefined && genre !== null) {
    whereConditions.push("genre = ?");
    params.push(genre);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(" AND ")}` 
    : "";

  // 2. Validate and resolve ORDER BY clause against strict whitelists
  const validatedSortBy = ALLOWED_SORT_COLUMNS[sortBy] || "created_at";
  const validatedSortOrder = ALLOWED_SORT_ORDERS[String(sortOrder).toUpperCase()] || "DESC";
  const orderByClause = `ORDER BY ${validatedSortBy} ${validatedSortOrder}`;

  // 3. Construct final SQL query statement
  const sql = `
    SELECT 
      ${BEAT_COLUMNS}
    FROM beats 
    ${whereClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;

  // Append pagination parameters
  params.push(Number(limit), Number(offset));

  try {
    const results = await db.prepare(sql).bind(...params).all();

    // Handle both local array return and D1 { results: [...] } structure
    if (Array.isArray(results)) {
      return results;
    }
    if (results && Array.isArray(results.results)) {
      return results.results;
    }
    return [];
  } catch (err) {
    if (err instanceof RepositoryError) {
      throw err;
    }
    throw new RepositoryError(`Failed to list beats: ${err.message}`, err);
  }
};

/**
 * Performs a dynamic partial update on a beat record and returns the updated entity.
 *
 * @param {string} publicId - Public ULID handle of the beat to update.
 * @param {Object} updates - Object containing fields to update.
 * @returns {Promise<Object|null>} The freshly updated beat record, or null if no record matched publicId.
 * @throws {RepositoryError} If database execution fails or uniqueness constraint fails.
 */
const updateBeat = async (publicId, updates = {}) => {
  const setClauses = [];
  const params = [];

  // 1. Iterate over supplied fields and match against UPDATABLE_COLUMNS whitelist
  Object.keys(updates).forEach((key) => {
    const columnName = UPDATABLE_COLUMNS[key];
    if (columnName && updates[key] !== undefined) {
      setClauses.push(`${columnName} = ?`);
      params.push(updates[key]);
    }
  });

  // If no valid updatable fields were supplied, return current state without executing an update
  if (setClauses.length === 0) {
    return findByPublicId(publicId);
  }

  // 2. Always append updated_at timestamp
  setClauses.push("updated_at = CURRENT_TIMESTAMP");

  // 3. Append publicId for the WHERE clause binding
  params.push(publicId);

  const sql = `
    UPDATE beats 
    SET 
      ${setClauses.join(",\n      ")}
    WHERE public_id = ?
  `;

  try {
    const result = await db.prepare(sql).bind(...params).run();

    // Inspect change count across D1 and local SQLite drivers
    const changesCount = result ? (result.changes !== undefined ? result.changes : (result.meta ? result.meta.changes : 1)) : 0;

    if (changesCount === 0) {
      return null;
    }

    // Return the freshly updated beat entity via findByPublicId
    return await findByPublicId(publicId);
  } catch (err) {
    if (err instanceof RepositoryError) {
      throw err;
    }
    throw new RepositoryError(`Failed to update beat record: ${err.message}`, err);
  }
};

/**
 * Updates the status column of a beat record and returns the updated entity.
 *
 * @param {string} publicId - Public ULID handle of the beat.
 * @param {string} status - New workflow status ('draft', 'published', 'archived').
 * @returns {Promise<Object|null>} The updated beat record, or null if no record matched publicId.
 * @throws {RepositoryError} If database query execution fails.
 */
const updateStatus = async (publicId, status) => {
  const sql = `
    UPDATE beats 
    SET 
      status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE public_id = ?
  `;

  try {
    const result = await db.prepare(sql).bind(status, publicId).run();

    const changesCount = result ? (result.changes !== undefined ? result.changes : (result.meta ? result.meta.changes : 1)) : 0;

    if (changesCount === 0) {
      return null;
    }

    return await findByPublicId(publicId);
  } catch (err) {
    if (err instanceof RepositoryError) {
      throw err;
    }
    throw new RepositoryError(`Failed to update beat status: ${err.message}`, err);
  }
};

/**
 * Locates a single beat record matching the given internal integer database ID.
 *
 * @param {number} id - Internal database primary key ID.
 * @returns {Promise<Object|null>} The raw beat record if found, or null if no matching record exists.
 * @throws {RepositoryError} If database query execution fails.
 */
const getBeatById = async (id) => {
  const sql = `
    SELECT 
      ${BEAT_COLUMNS}
    FROM beats 
    WHERE id = ?
  `;

  try {
    const beat = await db.prepare(sql).bind(id).first();
    return beat || null;
  } catch (err) {
    if (err instanceof RepositoryError) {
      throw err;
    }
    throw new RepositoryError(`Failed to fetch beat by ID: ${err.message}`, err);
  }
};

module.exports = {
  createBeat,
  findByPublicId,
  findBySlug,
  existsBySlug,
  listBeats,
  updateBeat,
  updateStatus,
  getBeatById
};

