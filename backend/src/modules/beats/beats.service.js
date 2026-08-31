/**
 * @fileoverview Beats Service Layer
 * Coordinates business logic, ULID generation, slug uniqueness, and DTO transformation for beats.
 */

const { ulid } = require("ulid");
const repository = require("./beats.repository");
const usersRepository = require("../users/users.repository");
const AppError = require("../../errors/AppError");

/**
 * Whitelist of permitted sort columns for admin catalog queries.
 */
const ALLOWED_ADMIN_SORT_FIELDS = ["created_at", "title", "price_amount"];

/**
 * Whitelist of permitted sort directions.
 */
const ALLOWED_ADMIN_SORT_ORDERS = ["ASC", "DESC"];

/**
 * State machine matrix defining permitted workflow status transitions.
 */
const ALLOWED_STATUS_TRANSITIONS = {
  draft: ["draft", "published", "archived"],
  published: ["published", "archived"],
  archived: ["archived", "draft"]
};

/**
 * Transforms a raw string into a clean, URL-safe SEO slug.
 *
 * @param {string} text - Raw title string.
 * @returns {string} Clean URL-safe slug.
 */
const formatSlug = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Generates a verified unique URL slug for a beat title.
 * Appends suffix sequences (-2, -3) if a collision occurs.
 *
 * @param {string} title - Beat title string.
 * @returns {Promise<string>} Unique URL slug.
 */
const generateUniqueSlug = async (title) => {
  const baseSlug = formatSlug(title);
  if (!baseSlug) {
    throw new AppError("Could not generate a valid URL slug from the title provided.", 400);
  }

  let slug = baseSlug;
  let isExists = await repository.existsBySlug(slug);
  let counter = 2;

  while (isExists) {
    slug = `${baseSlug}-${counter}`;
    isExists = await repository.existsBySlug(slug);
    counter++;
  }

  return slug;
};

/**
 * Resolves a storage object key into an absolute public HTTPS URL.
 *
 * @param {string|null} key - Cloudflare R2 storage key.
 * @returns {string|null} Resolved public HTTPS URL or null.
 */
const resolvePublicUrl = (key) => {
  if (!key || typeof key !== "string") return null;
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }
  const r2Url = process.env.R2_PUBLIC_URL;
  if (r2Url) {
    return `${r2Url.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
  }

  // If R2 is not configured, try to resolve a public backend URL.
  // Preference order:
  // 1. BACKEND_PUBLIC_URL (explicit backend service URL)
  // 2. APP_URL (app-level public URL, may be frontend or shared domain)
  // 3. fallback to localhost with PORT
  const backendPublic = process.env.BACKEND_PUBLIC_URL || process.env.APP_URL || `http://localhost:${process.env.PORT || 5005}`;
  return `${backendPublic.replace(/\/$/, "")}/api/media?key=${encodeURIComponent(key)}`;
};

/**
 * Transforms a raw database Beat entity into a clean, public-facing API DTO.
 * Redacts internal IDs and resolves R2 object keys to absolute URLs.
 *
 * @param {Object} beatEntity - Raw beat row from the repository.
 * @returns {Object|null} Public API Beat DTO.
 */
const toPublicBeatDto = (beatEntity) => {
  if (!beatEntity) return null;

  const priceAmount = Number(beatEntity.price_amount) || 0;
  const formattedPrice = (priceAmount / 100).toFixed(2);

  return {
    public_id: beatEntity.public_id,
    title: beatEntity.title,
    slug: beatEntity.slug,
    price_amount: priceAmount,
    currency_code: beatEntity.currency_code || "INR",
    formatted_price: formattedPrice,
    genre: beatEntity.genre || null,
    bpm: beatEntity.bpm !== null && beatEntity.bpm !== undefined ? Number(beatEntity.bpm) : null,
    musical_key: beatEntity.musical_key || null,
    description: beatEntity.description || null,
    audio_url: resolvePublicUrl(beatEntity.audio_key),
    cover_url: resolvePublicUrl(beatEntity.cover_key),
    banner_url: resolvePublicUrl(beatEntity.banner_key),
    duration: beatEntity.duration !== null && beatEntity.duration !== undefined ? Number(beatEntity.duration) : null,
    status: beatEntity.status,
    created_at: beatEntity.created_at
  };
};

/**
 * Validates business invariants, generates identifiers, calls the repository, and returns a public DTO.
 *
 * @param {Object} beatInput - Input payload from Controller.
 * @param {number} creatorUserId - Internal ID of the creator user.
 * @returns {Promise<Object>} Public API Beat DTO.
 * @throws {AppError} If validation fails or slug cannot be created.
 */
const createBeat = async (beatInput, creatorUserId) => {
  if (!beatInput) {
    throw new AppError("Beat input payload is required.", 400);
  }
  if (!creatorUserId) {
    throw new AppError("Creator user identification is required.", 400);
  }

  // Resolve internal database integer ID from public UUID string or number
  let internalUserId;
  if (typeof creatorUserId === "number" || (typeof creatorUserId === "string" && /^\d+$/.test(creatorUserId))) {
    internalUserId = Number(creatorUserId);
    const user = await usersRepository.getUserById(internalUserId);
    if (!user) {
      throw new AppError("Creator user profile not found", 400);
    }
  } else {
    const user = await usersRepository.findUserByPublicId(creatorUserId);
    if (!user) {
      throw new AppError("Creator user profile not found", 400);
    }
    internalUserId = user.id;
  }

  // 1. Business Invariant Checks
  const title = typeof beatInput.title === "string" ? beatInput.title.trim() : "";
  if (!title) {
    throw new AppError("Beat title is required.", 400);
  }

  const audioKey = typeof beatInput.audio_key === "string" ? beatInput.audio_key.trim() : "";
  if (!audioKey) {
    throw new AppError("Audio storage key is required.", 400);
  }

  const priceAmount = beatInput.price_amount !== undefined ? Number(beatInput.price_amount) : 0;
  if (isNaN(priceAmount) || priceAmount < 0) {
    throw new AppError("Price amount must be a non-negative integer.", 400);
  }

  // 2. Generate Unique Public ID (bt_<ULID>) and SEO Slug
  const publicId = `bt_${ulid()}`;
  const slug = await generateUniqueSlug(title);

  // 3. Assemble Prepared Persistence Payload
  const preparedPayload = {
    public_id: publicId,
    title,
    slug,
    price_amount: Math.floor(priceAmount),
    currency_code: (beatInput.currency_code || "INR").toUpperCase().trim(),
    genre: beatInput.genre ? String(beatInput.genre).trim() : null,
    bpm: beatInput.bpm ? Number(beatInput.bpm) : null,
    musical_key: beatInput.musical_key ? String(beatInput.musical_key).trim() : null,
    description: beatInput.description ? String(beatInput.description).trim() : null,
    audio_key: audioKey,
    cover_key: beatInput.cover_key ? String(beatInput.cover_key).trim() : null,
    banner_key: beatInput.banner_key ? String(beatInput.banner_key).trim() : null,
    duration: beatInput.duration ? Number(beatInput.duration) : null,
    status: beatInput.status ? String(beatInput.status).toLowerCase().trim() : "draft",
    created_by: internalUserId
  };

  // 4. Persist via Repository
  const createdEntity = await repository.createBeat(preparedPayload);

  // 5. Transform Database Entity into Public DTO Response
  return toPublicBeatDto(createdEntity);
};

/**
 * Retrieves a beat record by its public_id and transforms it into a public API DTO.
 *
 * @param {string} publicId - Public ULID identifier (bt_...).
 * @returns {Promise<Object>} Public API Beat DTO.
 * @throws {AppError} If publicId is missing (400) or beat is not found (404).
 */
const getBeatByPublicId = async (publicId) => {
  if (!publicId || typeof publicId !== "string" || !publicId.trim()) {
    throw new AppError("Public ID is required.", 400);
  }

  const beatEntity = await repository.findByPublicId(publicId.trim());
  if (!beatEntity) {
    throw new AppError("Beat not found.", 404);
  }

  return toPublicBeatDto(beatEntity);
};

/**
 * Retrieves a published beat record by its SEO slug for the storefront catalog.
 * Excludes draft and archived beats (returns 404).
 *
 * @param {string} slug - SEO URL slug (e.g. "midnight-drive").
 * @returns {Promise<Object>} Public API Beat DTO.
 * @throws {AppError} If slug is missing (400) or beat is not found / not published (404).
 */
const getBeatBySlug = async (slug) => {
  if (!slug || typeof slug !== "string" || !slug.trim()) {
    throw new AppError("Slug is required.", 400);
  }

  const beatEntity = await repository.findBySlug(slug.trim());
  if (!beatEntity || beatEntity.status !== "published") {
    throw new AppError("Beat not found.", 404);
  }

  return toPublicBeatDto(beatEntity);
};

/**
 * Retrieves a paginated list of published beats for the public storefront catalog.
 * Enforces status = "published" and maps results to public API DTOs.
 *
 * @param {Object} [options={}] - Query options (genre, limit, offset, sortBy, sortOrder).
 * @returns {Promise<Array<Object>>} Array of public API Beat DTOs, or empty array [].
 * @throws {AppError} If limit or offset values are invalid.
 */
const listPublicBeats = async (options = {}) => {
  const limit = options.limit !== undefined ? Number(options.limit) : 20;
  const offset = options.offset !== undefined ? Number(options.offset) : 0;

  if (isNaN(limit) || limit < 0) {
    throw new AppError("Limit must be a non-negative number.", 400);
  }
  if (isNaN(offset) || offset < 0) {
    throw new AppError("Offset must be a non-negative number.", 400);
  }

  // Enforce status = "published" and override any client-supplied status
  const repositoryOptions = {
    genre: options.genre ? String(options.genre).trim() : undefined,
    limit: Math.floor(limit),
    offset: Math.floor(offset),
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    status: "published"
  };

  const entities = await repository.listBeats(repositoryOptions);

  if (!Array.isArray(entities) || entities.length === 0) {
    return [];
  }

  return entities.map(toPublicBeatDto);
};

/**
 * Retrieves a paginated list of all beats (drafts, published, archived) for the administrative dashboard.
 *
 * @param {Object} [options={}] - Query criteria (status, genre, limit, offset, sortBy, sortOrder).
 * @returns {Promise<Array<Object>>} Array of public API Beat DTOs, or empty array [].
 * @throws {AppError} If validation fails for limit, offset, sortBy, or sortOrder.
 */
const listAdminBeats = async (options = {}) => {
  const limit = options.limit !== undefined ? Number(options.limit) : 20;
  const offset = options.offset !== undefined ? Number(options.offset) : 0;

  if (isNaN(limit) || limit < 0) {
    throw new AppError("Limit must be a non-negative integer.", 400);
  }
  if (isNaN(offset) || offset < 0) {
    throw new AppError("Offset must be a non-negative integer.", 400);
  }

  // Validate sortBy parameter against strict whitelist
  const sortBy = options.sortBy || "created_at";
  if (!ALLOWED_ADMIN_SORT_FIELDS.includes(sortBy)) {
    throw new AppError("Invalid sortBy field. Allowed fields: created_at, title, price_amount.", 400);
  }

  // Validate sortOrder parameter against strict whitelist
  const sortOrder = options.sortOrder ? String(options.sortOrder).toUpperCase() : "DESC";
  if (!ALLOWED_ADMIN_SORT_ORDERS.includes(sortOrder)) {
    throw new AppError("Invalid sortOrder. Allowed values: ASC, DESC.", 400);
  }

  // Construct isolated repository options object without mutating caller input
  const repositoryOptions = {
    status: options.status ? String(options.status).trim() : undefined,
    genre: options.genre ? String(options.genre).trim() : undefined,
    limit: Math.floor(limit),
    offset: Math.floor(offset),
    sortBy,
    sortOrder
  };

  const entities = await repository.listBeats(repositoryOptions);

  if (!Array.isArray(entities) || entities.length === 0) {
    return [];
  }

  return entities.map(toPublicBeatDto);
};

/**
 * Performs a partial update on an existing beat record with business rule validation and auto-slug regeneration.
 *
 * @param {string} publicId - Public ULID identifier (bt_...).
 * @param {Object} updatesPayload - Partial update payload.
 * @param {number} adminUserId - Internal ID of the requesting admin.
 * @returns {Promise<Object>} Updated public API Beat DTO.
 * @throws {AppError} If inputs are invalid (400), immutable fields are supplied (400), or beat is not found (404).
 */
const updateBeat = async (publicId, updatesPayload, adminUserId) => {
  if (!publicId || typeof publicId !== "string" || !publicId.trim()) {
    throw new AppError("Public ID is required.", 400);
  }
  if (!updatesPayload || typeof updatesPayload !== "object" || Array.isArray(updatesPayload)) {
    throw new AppError("Update payload is required.", 400);
  }
  if (!adminUserId) {
    throw new AppError("Admin user identification is required.", 400);
  }

  // 1. Reject immutable field mutation attempts
  const immutableFields = ["id", "public_id", "created_by", "created_at"];
  for (const field of immutableFields) {
    if (updatesPayload[field] !== undefined) {
      throw new AppError(`Field '${field}' is immutable and cannot be updated.`, 400);
    }
  }

  // 2. Fetch existing beat record
  const existingBeat = await repository.findByPublicId(publicId.trim());
  if (!existingBeat) {
    throw new AppError("Beat not found.", 404);
  }

  const sanitizedPayload = {};

  // 3. Handle Title modification and automatic slug regeneration
  if (updatesPayload.title !== undefined) {
    const newTitle = String(updatesPayload.title).trim();
    if (!newTitle) {
      throw new AppError("Beat title cannot be empty.", 400);
    }

    if (newTitle !== existingBeat.title) {
      sanitizedPayload.title = newTitle;
      sanitizedPayload.slug = await generateUniqueSlug(newTitle);
    }
  }

  // 4. Validate & sanitize editable fields
  if (updatesPayload.price_amount !== undefined) {
    const priceAmount = Number(updatesPayload.price_amount);
    if (isNaN(priceAmount) || priceAmount < 0) {
      throw new AppError("Price amount must be a non-negative integer.", 400);
    }
    sanitizedPayload.price_amount = Math.floor(priceAmount);
  }

  if (updatesPayload.currency_code !== undefined) {
    const currencyCode = String(updatesPayload.currency_code).trim().toUpperCase();
    if (!currencyCode) {
      throw new AppError("Currency code cannot be empty.", 400);
    }
    sanitizedPayload.currency_code = currencyCode;
  }

  if (updatesPayload.genre !== undefined) {
    sanitizedPayload.genre = updatesPayload.genre ? String(updatesPayload.genre).trim() : null;
  }

  if (updatesPayload.bpm !== undefined) {
    if (updatesPayload.bpm === null) {
      sanitizedPayload.bpm = null;
    } else {
      const bpmVal = Number(updatesPayload.bpm);
      if (isNaN(bpmVal) || bpmVal < 0) {
        throw new AppError("BPM must be a non-negative number.", 400);
      }
      sanitizedPayload.bpm = Math.floor(bpmVal);
    }
  }

  if (updatesPayload.musical_key !== undefined) {
    sanitizedPayload.musical_key = updatesPayload.musical_key ? String(updatesPayload.musical_key).trim() : null;
  }

  if (updatesPayload.description !== undefined) {
    sanitizedPayload.description = updatesPayload.description ? String(updatesPayload.description).trim() : null;
  }

  if (updatesPayload.audio_key !== undefined) {
    const audioKey = String(updatesPayload.audio_key).trim();
    if (!audioKey) {
      throw new AppError("Audio storage key cannot be empty.", 400);
    }
    sanitizedPayload.audio_key = audioKey;
  }

  if (updatesPayload.cover_key !== undefined) {
    sanitizedPayload.cover_key = updatesPayload.cover_key ? String(updatesPayload.cover_key).trim() : null;
  }

  if (updatesPayload.banner_key !== undefined) {
    sanitizedPayload.banner_key = updatesPayload.banner_key ? String(updatesPayload.banner_key).trim() : null;
  }

  if (updatesPayload.duration !== undefined) {
    if (updatesPayload.duration === null) {
      sanitizedPayload.duration = null;
    } else {
      const durationVal = Number(updatesPayload.duration);
      if (isNaN(durationVal) || durationVal < 0) {
        throw new AppError("Duration must be a non-negative number.", 400);
      }
      sanitizedPayload.duration = Math.floor(durationVal);
    }
  }

  if (updatesPayload.status !== undefined) {
    const statusVal = String(updatesPayload.status).toLowerCase().trim();
    if (!["draft", "published", "archived"].includes(statusVal)) {
      throw new AppError("Invalid status value. Must be draft, published, or archived.", 400);
    }
    sanitizedPayload.status = statusVal;
  }

  // 5. Ensure at least one valid field is being updated
  if (Object.keys(sanitizedPayload).length === 0) {
    throw new AppError("No valid fields supplied for update.", 400);
  }

  // 6. Execute update via Repository
  const updatedEntity = await repository.updateBeat(publicId.trim(), sanitizedPayload);
  if (!updatedEntity) {
    throw new AppError("Beat not found.", 404);
  }

  // 7. Return Public API DTO
  return toPublicBeatDto(updatedEntity);
};

/**
 * Updates the lifecycle status of a beat while enforcing state machine transition rules.
 *
 * @param {string} publicId - Public ULID identifier (bt_...).
 * @param {string} status - Target status ('draft', 'published', 'archived').
 * @param {number} adminUserId - Internal ID of the requesting admin.
 * @returns {Promise<Object>} Updated public API Beat DTO.
 * @throws {AppError} If inputs are invalid (400), transition is illegal (400), or beat is missing (404).
 */
const updateStatus = async (publicId, status, adminUserId) => {
  if (!publicId || typeof publicId !== "string" || !publicId.trim()) {
    throw new AppError("Public ID is required.", 400);
  }
  if (!status || typeof status !== "string" || !status.trim()) {
    throw new AppError("Status is required.", 400);
  }
  if (!adminUserId) {
    throw new AppError("Admin user identification is required.", 400);
  }

  const targetStatus = status.toLowerCase().trim();
  const validStatuses = ["draft", "published", "archived"];
  if (!validStatuses.includes(targetStatus)) {
    throw new AppError("Invalid status value. Must be draft, published, or archived.", 400);
  }

  // 1. Fetch existing beat record
  const existingBeat = await repository.findByPublicId(publicId.trim());
  if (!existingBeat) {
    throw new AppError("Beat not found.", 404);
  }

  const currentStatus = existingBeat.status;

  // 2. Enforce state machine transition matrix
  const allowedNextStates = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedNextStates.includes(targetStatus)) {
    throw new AppError(`Cannot change status from '${currentStatus}' to '${targetStatus}'.`, 400);
  }

  // If status is unchanged, return current state directly
  if (currentStatus === targetStatus) {
    return toPublicBeatDto(existingBeat);
  }

  // 3. Execute status update via Repository
  const updatedEntity = await repository.updateStatus(publicId.trim(), targetStatus);
  if (!updatedEntity) {
    throw new AppError("Beat not found.", 404);
  }

  // 4. Return Public API DTO
  return toPublicBeatDto(updatedEntity);
};

/**
 * Handles inventory updates when an order is fulfilled.
 * For exclusive licenses, transitions the beat status to archived so it is removed from the catalog.
 *
 * @param {Object} order - The fulfilled order snapshot.
 * @param {Object} [tx] - Optional transaction client connection.
 * @returns {Promise<void>}
 */
const handleOrderFulfillment = async (order, tx) => {
  if (!order || !order.items) return;
  for (const item of order.items) {
    if (item.licenseType === "exclusive" || item.license_type === "exclusive") {
      const beat = await repository.getBeatById(item.beatId || item.beat_id);
      if (beat) {
        const sql = `UPDATE beats SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        if (tx) {
          await new Promise((resolve, reject) => {
            tx.run(sql, [beat.id], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } else {
          await db.prepare(sql).bind(beat.id).run();
        }
      }
    }
  }
};

module.exports = {
  createBeat,
  getBeatByPublicId,
  getBeatBySlug,
  listPublicBeats,
  listAdminBeats,
  updateBeat,
  updateStatus,
  handleOrderFulfillment
};
