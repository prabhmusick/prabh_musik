const crypto = require("crypto");
const downloadsRepository = require("./downloads.repository");
const ownershipsService = require("../ownerships/ownerships.service");
const { storageProvider } = require("../../storage/r2.provider");
const downloadConfig = require("../../config/download.config");
const AppError = require("../../errors/AppError");
const logger = require("../../utils/logger");

// Token based logic (historical/internal references)
const requestDownloadToken = async (userId, ownershipId) => {
  const ownership = await ownershipsService.isOwnershipValid(ownershipId);
  if (ownership.user_id !== userId) {
    throw new AppError("Unauthorized access to ownership asset", 403);
  }

  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + downloadConfig.TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await downloadsRepository.createDownloadToken(ownershipId, tokenHash, expiresAt);

  return {
    success: true,
    token,
    expiresIn: downloadConfig.TOKEN_EXPIRY_MINUTES * 60
  };
};

const executeDownload = async (token, ipAddress, userAgent) => {
  if (!token) {
    throw new AppError("Download token is required", 400);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const tokenRecord = await downloadsRepository.getDownloadToken(tokenHash);
  if (!tokenRecord) {
    throw new AppError("Invalid download token provided", 401);
  }

  const ownershipId = tokenRecord.ownership_id;
  const tokenId = tokenRecord.id;

  const isTokenExpired = new Date().getTime() > new Date(tokenRecord.expires_at).getTime();
  if (isTokenExpired) {
    await downloadsRepository.createDownloadLog({
      ownershipId,
      tokenId,
      ipAddress,
      userAgent,
      status: "expired"
    });
    throw new AppError("Download token has expired", 401);
  }

  let ownership;
  try {
    ownership = await ownershipsService.isOwnershipValid(ownershipId);
  } catch (err) {
    const statusText = err.message === "Download limit exceeded"
      ? "limit_exceeded"
      : err.message.includes("expired")
        ? "expired"
        : "revoked";

    await downloadsRepository.createDownloadLog({
      ownershipId,
      tokenId,
      ipAddress,
      userAgent,
      status: statusText
    });
    throw err;
  }

  await downloadsRepository.createDownloadLog({
    ownershipId,
    tokenId,
    ipAddress,
    userAgent,
    status: "success"
  });

  await downloadsRepository.markTokenUsed(tokenId);
  await ownershipsService.incrementDownloadsCount(ownershipId);

  const audioKey = ownership.audio_key;
  if (!audioKey) {
    throw new AppError("Audio file key not found on beat assets", 404);
  }

  const presignedUrl = await storageProvider.generatePresignedDownloadUrl(audioKey, 300);

  return {
    presignedUrl,
    filename: `${ownership.beat_title}.mp3`
  };
};

const revokeTokensByOwnership = async (ownershipId) => {
  return downloadsRepository.revokeTokensByOwnership(ownershipId);
};

const cleanupExpiredTokens = async () => {
  return downloadsRepository.deleteExpiredTokens();
};

/**
 * Verifies if the authenticated customer owns the active and valid beat license.
 */
const verifyDownloadAccess = async (userId, ownershipPublicId) => {
  if (!userId || !ownershipPublicId) {
    throw new AppError("User ID and Ownership Public ID are required", 400);
  }

  // A. Check ownership existence
  let ownership;
  try {
    ownership = await ownershipsService.getOwnershipByPublicId(ownershipPublicId);
  } catch (err) {
    logger.warn({
      event: "DOWNLOAD_DENIED",
      userId,
      ownershipPublicId,
      reason: "Ownership not found"
    });
    throw err;
  }

  // B. Check ownership user association
  if (ownership.user_id !== userId) {
    logger.warn({
      event: "DOWNLOAD_DENIED",
      userId,
      ownershipId: ownership.id,
      beatId: ownership.beat_id,
      reason: "Ownership user mismatch"
    });
    throw new AppError("Access denied. You do not own this license.", 403);
  }

  // C. Verify active/expired status and limits via OwnershipService source of truth
  try {
    await ownershipsService.isOwnershipValid(ownership.id);
  } catch (err) {
    if (err.message === "Download limit exceeded") {
      logger.warn({
        event: "DOWNLOAD_LIMIT_REACHED",
        userId,
        ownershipId: ownership.id,
        beatId: ownership.beat_id,
        reason: err.message
      });
    } else {
      logger.warn({
        event: "INVALID_LICENSE",
        userId,
        ownershipId: ownership.id,
        beatId: ownership.beat_id,
        reason: err.message
      });
    }
    
    // Log DOWNLOAD_DENIED event
    logger.warn({
      event: "DOWNLOAD_DENIED",
      userId,
      ownershipId: ownership.id,
      beatId: ownership.beat_id,
      reason: err.message
    });
    throw err;
  }

  return ownership;
};

/**
 * Creates temporary presigned URL for the given key and expiration window
 */
const createSignedUrl = async (audioKey, expiresInSeconds = 300) => {
  const url = await storageProvider.generatePresignedDownloadUrl(audioKey, expiresInSeconds);
  return url;
};

/**
 * Increments the download counter inside the repository
 */
const incrementDownloadCount = async (ownershipId) => {
  return ownershipsService.incrementDownloadsCount(ownershipId);
};

/**
 * Creates audit log persistence event
 */
const recordDownload = async (ownershipId, tokenId, ipAddress, userAgent, status) => {
  return downloadsRepository.createDownloadLog({
    ownershipId,
    tokenId,
    ipAddress,
    userAgent,
    status
  });
};

/**
 * Securely handles the download flow validation, logging, and URL generation.
 */
const generateDownload = async (userId, ownershipPublicId, ipAddress, userAgent) => {
  // 1. Audit start of request
  logger.info({
    event: "DOWNLOAD_REQUESTED",
    userId,
    ownershipPublicId
  });

  // 2. Access control and validity validation
  const ownership = await verifyDownloadAccess(userId, ownershipPublicId);

  // 3. Generate presigned delivery URL
  const audioKey = ownership.audio_key;
  if (!audioKey) {
    logger.error({
      event: "DOWNLOAD_DENIED",
      userId,
      ownershipId: ownership.id,
      beatId: ownership.beat_id,
      reason: "Asset file key missing on beat catalog record"
    });
    throw new AppError("Audio file key not found on beat assets", 404);
  }

  const presignedUrl = await createSignedUrl(audioKey, 300);

  logger.info({
    event: "SIGNED_URL_GENERATED",
    ownershipId: ownership.id,
    beatId: ownership.beat_id
  });

  // 4. Increment download log count and store audit log
  await incrementDownloadCount(ownership.id);
  await recordDownload(ownership.id, null, ipAddress, userAgent, "success");

  logger.info({
    event: "DOWNLOAD_GRANTED",
    userId,
    ownershipId: ownership.id,
    beatId: ownership.beat_id
  });

  return {
    downloadUrl: presignedUrl,
    filename: `${ownership.beat_title}.mp3`
  };
};

/**
 * Gets download logs history list for an ownership.
 */
const getDownloadHistory = async (ownershipId) => {
  return downloadsRepository.getDownloadHistory(ownershipId);
};

/**
 * Gets download history cross all beats owned by the customer
 */
const getDownloadHistoryByUser = async (userId) => {
  return downloadsRepository.getDownloadHistoryByUser(userId);
};

/**
 * Gets all download history for Admin check.
 */
const getAllDownloadHistory = async () => {
  return downloadsRepository.getAllDownloadHistory();
};

/**
 * Gets download logs history specifically for the given ownership public ID for Admin check.
 */
const getDownloadHistoryByPublicId = async (ownershipPublicId) => {
  return downloadsRepository.getDownloadHistoryByPublicId(ownershipPublicId);
};

module.exports = {
  requestDownloadToken,
  executeDownload,
  revokeTokensByOwnership,
  cleanupExpiredTokens,
  generateDownload,
  verifyDownloadAccess,
  createSignedUrl,
  incrementDownloadCount,
  recordDownload,
  getDownloadHistory,
  getDownloadHistoryByUser,
  getAllDownloadHistory,
  getDownloadHistoryByPublicId
};
