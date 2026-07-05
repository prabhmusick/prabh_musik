const repository = require("./ownerships.repository");
const AppError = require("../../errors/AppError");
const validator = require("./ownerships.validator");

const OWNERSHIP_STATUS = {
  ACTIVE: "active",
  REVOKED: "revoked"
};

const downloadConfig = require("../../config/download.config");

/**
 * Maps license types to download limits
 */
const getLicenseDownloadLimit = (licenseType) => {
  const type = String(licenseType || "").toLowerCase();
  return downloadConfig.DOWNLOAD_LIMITS[type] !== undefined
    ? downloadConfig.DOWNLOAD_LIMITS[type]
    : null;
};

/**
 * Checks active validity of an ownership (revoked, expiry, and download limits).
 * Returns the fully populated ownership record if valid.
 */
const isOwnershipValid = async (id) => {
  const ownership = await repository.getOwnershipById(id);
  if (!ownership || ownership.status !== OWNERSHIP_STATUS.ACTIVE) {
    throw new AppError("Ownership record not found or inactive", 404);
  }

  // 1. Expiration check using server UTC timestamp
  if (ownership.expires_at) {
    const expiresTime = new Date(ownership.expires_at).getTime();
    const currentTime = new Date().getTime();
    if (currentTime > expiresTime) {
      throw new AppError("Ownership has expired", 403);
    }
  }

  // 2. Download count limit check
  if (ownership.max_downloads !== null && ownership.max_downloads !== undefined) {
    if (ownership.download_count >= ownership.max_downloads) {
      throw new AppError("Download limit exceeded", 403);
    }
  }

  return ownership;
};

/**
 * Validates and increments the download counter.
 * Returns updated download counts and remaining counts.
 */
const incrementDownloads = async (id) => {
  // Validate checks: active status, expiry date, download counts
  await isOwnershipValid(id);

  const success = await repository.incrementDownloadCount(id);
  if (!success) {
    throw new AppError("Failed to update download logs", 500);
  }

  const updated = await repository.getOwnershipById(id);
  const remainingDownloads = updated.max_downloads === null
    ? "unlimited"
    : Math.max(0, updated.max_downloads - updated.download_count);

  return {
    downloadCount: updated.download_count,
    remainingDownloads,
    lastDownloadAt: updated.last_download_at
  };
};

/**
 * Maps and inserts new ownerships transactional block from order payload.
 *
 * @typedef {Object} PaidOrderSnapshot
 * @property {number} id
 * @property {Object} customer
 * @property {number} customer.id
 * @property {Array<Object>} items
 * @property {number} items[].beatId
 * @property {string} items[].title
 * @property {number} items[].price
 * @property {string} items[].licenseType
 */
const createOwnershipsFromOrder = async (order, tx) => {
  if (!order || !order.id || !order.customer || !order.customer.id || !Array.isArray(order.items)) {
    throw new AppError("Invalid order structure snapshot provided", 400);
  }

  const userId = order.customer.id;
  const orderId = order.id;
  const mappedItems = [];

  for (const item of order.items) {
    if (!item.beatId || item.price === undefined || !item.licenseType) {
      throw new AppError("Invalid order item snapshot data", 400);
    }

    // Duplicate Check
    const exists = await repository.existsOwnership(userId, item.beatId, orderId);
    if (exists) {
      throw new AppError("Duplicate ownership record exists", 409);
    }

    const maxDownloads = getLicenseDownloadLimit(item.licenseType);

    mappedItems.push({
      beatId: item.beatId,
      licenseType: item.licenseType,
      purchasePrice: item.price,
      maxDownloads,
      expiresAt: null,
      downloadToken: null
    });
  }

  // Pass down database connection client object context
  const insertedIds = await repository.insertOwnershipsTransaction(userId, orderId, mappedItems, tx);
  
  const results = [];
  for (const insertedId of insertedIds) {
    const row = await repository.getOwnershipById(insertedId);
    results.push(row);
  }
  return results;
};

/**
 * Checks if ownership records exist for the given order ID
 */
const hasOwnershipsForOrder = async (orderId) => {
  const list = await repository.getOwnershipsByOrder(orderId);
  return list.length > 0;
};

/**
 * Get ownership record by ID
 */
const getOwnership = async (id) => {
  const row = await repository.getOwnershipById(id);
  if (!row) {
    throw new AppError("Ownership not found", 404);
  }
  return row;
};

/**
 * Get all active ownership records
 */
const getAllOwnerships = async () => {
  return repository.getOwnerships();
};

/**
 * Expose collection filters
 */
const getOwnershipsByUser = async (userId) => {
  return repository.getOwnershipsByUser(userId);
};

const getOwnershipsByBeat = async (beatId) => {
  return repository.getOwnershipsByBeat(beatId);
};

/**
 * Expose update expiry
 */
const updateExpiry = async (id, expiresAtData) => {
  const existing = await repository.getOwnershipById(id);
  if (!existing || existing.status !== OWNERSHIP_STATUS.ACTIVE) {
    throw new AppError("Ownership not found or inactive", 404);
  }

  const { expiresAt } = validator.validateExpiryUpdate(expiresAtData);
  const success = await repository.updateExpiry(id, expiresAt);
  if (!success) {
    throw new AppError("Expiry update failed", 400);
  }

  return getOwnership(id);
};

/**
 * Expose soft revoke ownership
 */
/**
 * Expose soft revoke ownership
 */
const revokeOwnership = async (id) => {
  const existing = await repository.getOwnershipById(id);
  if (!existing || existing.status !== OWNERSHIP_STATUS.ACTIVE) {
    throw new AppError("Ownership not found or inactive", 404);
  }

  const success = await repository.revokeOwnership(id);
  if (!success) {
    throw new AppError("Revocation failed", 400);
  }

  // Require dynamically to prevent circular dependencies
  const downloadsService = require("../downloads/downloads.service");
  await downloadsService.revokeTokensByOwnership(id);

  return getOwnership(id);
};

/**
 * Checks if a license is exclusive.
 */
const isLicenseExclusive = (licenseType) => {
  return String(licenseType).toLowerCase() === "exclusive";
};

/**
 * Retreives customer purchased beat library with pagination and sorting whitelists
 */
const getLibraryByUser = async (userId, page = 1, pageSize = 20, sort = "purchaseDate", order = "desc") => {
  const SORT_FIELDS = {
    purchaseDate: "o.purchase_date",
    beatTitle: "b.beat_name",
    price: "o.purchase_price"
  };

  const sortBy = SORT_FIELDS[sort] || SORT_FIELDS.purchaseDate;
  const sortOrder = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

  const limit = parseInt(pageSize, 10) || 20;
  const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;

  return repository.getLibraryByUser(userId, limit, offset, sortBy, sortOrder);
};

/**
 * Increments ownership count (exposed for downloads service)
 */
const incrementDownloadsCount = async (id) => {
  return repository.incrementDownloadCount(id);
};

module.exports = {
  OWNERSHIP_STATUS,
  isOwnershipValid,
  incrementDownloads,
  createOwnershipsFromOrder,
  hasOwnershipsForOrder,
  getOwnership,
  getAllOwnerships,
  getOwnershipsByUser,
  getOwnershipsByBeat,
  updateExpiry,
  revokeOwnership,
  isLicenseExclusive,
  getLibraryByUser,
  incrementDownloadsCount
};
