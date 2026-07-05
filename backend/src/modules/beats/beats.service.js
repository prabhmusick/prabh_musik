const repository = require("./beats.repository");
const validator = require("./beats.validator");
const AppError = require("../../errors/AppError");
const r2Service = require("../../storage/r2.service");

// ==========================================
// Internal Helper Utilities
// ==========================================

/**
 * Transforms a raw string into a clean, URL-safe SEO slug
 *
 * @param {string} text - Raw string to format
 * @returns {string} Clean slug format
 */
const formatSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric characters with dashes
    .replace(/^-+|-+$/g, ""); // Trim leading and trailing dashes
};

/**
 * Generates a unique, URL-safe slug for a beat.
 * If the path conflicts, we append a suffix sequence beginning from 2.
 *
 * @param {string} beatName - The raw beat name
 * @returns {Promise<string>} A verified unique slug string
 */
const generateUniqueSlug = async (beatName) => {
  const baseSlug = formatSlug(beatName);

  if (!baseSlug) {
    throw new AppError(
      "Could not generate a valid slug from the beat name",
      400,
    );
  }

  let slug = baseSlug;
  let isUnique = !(await repository.existsBySlug(slug));
  let counter = 2; // Auto-increment starts from index 2 matching CMS standards

  // Append sequence index until uniqueness is confirmed
  while (!isUnique) {
    slug = `${baseSlug}-${counter}`;
    isUnique = !(await repository.existsBySlug(slug));
    counter++;
  }

  return slug;
};

// ==========================================
// Service Exports
// ==========================================

/**
 * Fetches a single beat record by ID or throws a 404 AppError
 *
 * @param {number|string} id - Beat ID
 * @returns {Promise<object>} The plain beat record object
 */
const getBeat = async (id) => {
  if (!id) {
    throw new AppError("Beat ID is required", 400);
  }

  const beat = await repository.getBeatById(id);
  if (!beat) {
    throw new AppError("Beat not found", 404);
  }

  return beat;
};

/**
 * Creates a new beat record after parsing and validating inputs.
 *
 * @param {object} beatData - Client submission payload properties
 * @returns {Promise<object>} The created beat record object
 */
const createBeat = async (beatData) => {
  // 1. Offload schema checks and type parsing to the validation layer
  const validated = validator.validateCreateBeat(beatData);

  // 2. Resolve unique slug path based on beat_name
  validated.slug = await generateUniqueSlug(validated.beat_name);

  // 3. Write database entry and fetch the returned record
  const id = await repository.createBeat(validated);
  return repository.getBeatById(id);
};

/**
 * Fetches all active non-archived beat records ordered by date descending
 *
 * @returns {Promise<Array<object>>} List of beat records
 */
const getAllBeats = async () => {
  return repository.getAllBeats();
};

/**
 * Updates properties of a beat record.
 * Automatically regenerates unique SEO slugs if the name has changed.
 *
 * @param {number|string} id - Beat ID
 * @param {object} updates - Changed properties object
 * @returns {Promise<object>} The updated beat record object
 */
const updateBeat = async (id, updates) => {
  // 1. Verify record existence (throws 404 if missing or archived)
  const existingBeat = await getBeat(id);

  // 2. Validate update parameters
  const cleanUpdates = validator.validateUpdateBeat(updates);

  // 3. Auto-regenerate slug if the beat_name value was modified
  if (
    cleanUpdates.beat_name !== undefined &&
    cleanUpdates.beat_name !== existingBeat.beat_name
  ) {
    cleanUpdates.slug = await generateUniqueSlug(cleanUpdates.beat_name);
  }

  // If there are no modified values to send, return the record directly
  if (Object.keys(cleanUpdates).length === 0) {
    return existingBeat;
  }

  // 4. Update and assert write changes counts
  const success = await repository.updateBeat(id, cleanUpdates);
  if (!success) {
    throw new AppError("No changes were made or beat update failed", 400);
  }

  // 5. Fetch fresh record from DB
  return repository.getBeatById(id);
};

/**
 * Soft deletes/archives a beat by updating its status to 'archived'
 *
 * @param {number|string} id - Beat ID
 * @returns {Promise<boolean>} True if transaction succeeded
 */
const archiveBeat = async (id) => {
  // Verify existence (throws 404 if missing or already archived)
  await getBeat(id);
  return repository.archiveBeat(id);
};

/**
 * Fetches a stored beat object from the configured storage backend.
 *
 * @param {string} key - Storage object key
 * @returns {Promise<{buffer: Buffer, contentType: string}>}
 */
const getBeatObject = async (key) => {
  if (!key) {
    throw new AppError("Object key is required", 400);
  }

  const decodedKey = decodeURIComponent(key);

  try {
    return await r2Service.getFile(decodedKey);
  } catch (err) {
    if (
      err.name === "NoSuchKey" ||
      err.Code === "NoSuchKey" ||
      err.code === "NoSuchKey"
    ) {
      throw new AppError("Object not found in storage", 404);
    }

    throw err;
  }
};

/**
 * Handles beat changes after successful order payment fulfillment
 */
const handleOrderFulfillment = async (order, tx) => {
  if (!order || !Array.isArray(order.items)) return;

  const ownershipsService = require("../ownerships/ownerships.service");

  for (const item of order.items) {
    if (ownershipsService.isLicenseExclusive(item.licenseType)) {
      await repository.updateSellingStatus(item.beatId, "sold", tx);
    }
  }
};

module.exports = {
  createBeat,
  getBeat,
  getAllBeats,
  updateBeat,
  archiveBeat,
  getBeatObject,
  handleOrderFulfillment,
};
