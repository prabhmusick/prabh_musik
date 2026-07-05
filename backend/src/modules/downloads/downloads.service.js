const crypto = require("crypto");
const downloadsRepository = require("./downloads.repository");
const ownershipsService = require("../ownerships/ownerships.service");
const storageService = require("../../storage/storage.service");
const downloadConfig = require("../../config/download.config");
const AppError = require("../../errors/AppError");

/**
 * Request secure short-lived download token
 */
const requestDownloadToken = async (userId, ownershipId) => {
  // 1. Verify ownership validity & authorization
  const ownership = await ownershipsService.isOwnershipValid(ownershipId);
  if (ownership.user_id !== userId) {
    throw new AppError("Unauthorized access to ownership asset", 403);
  }

  // 2. Concurrency duplicate checks: find existing active unexpired token
  const activeToken = await downloadsRepository.getActiveTokenByOwnership(ownershipId);
  if (activeToken) {
    return {
      success: true,
      token: activeToken.token,
      expiresIn: Math.max(0, Math.round((new Date(activeToken.expires_at).getTime() - Date.now()) / 1000))
    };
  }

  // 3. Generate new short-lived token
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + downloadConfig.TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await downloadsRepository.createDownloadToken(ownershipId, token, expiresAt);

  return {
    success: true,
    token,
    expiresIn: downloadConfig.TOKEN_EXPIRY_MINUTES * 60
  };
};

/**
 * Validates token and generates R2 presigned URL redirect metadata
 */
const executeDownload = async (token, ipAddress, userAgent) => {
  // 1. Retrieve token metadata
  const tokenRecord = await downloadsRepository.getDownloadToken(token);
  if (!tokenRecord) {
    throw new AppError("Invalid download token provided", 401);
  }

  const ownershipId = tokenRecord.ownership_id;
  const tokenId = tokenRecord.id;

  // 2. Validate token expiration
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

  // 3. Re-validate ownership permissions and limits
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

  // 4. Log download success and mark token usage
  await downloadsRepository.createDownloadLog({
    ownershipId,
    tokenId,
    ipAddress,
    userAgent,
    status: "success"
  });

  await downloadsRepository.markTokenUsed(tokenId);

  // 5. Increment ownership counter
  await ownershipsService.incrementDownloadsCount(ownershipId);

  // 6. Generate presigned delivery URL
  const audioKey = ownership.audio_key;
  if (!audioKey) {
    throw new AppError("Audio file key not found on beat assets", 404);
  }

  const presignedUrl = await storageService.generatePresignedDownloadUrl(audioKey, 300);

  return {
    presignedUrl,
    filename: `${ownership.beat_title}.mp3`
  };
};

/**
 * Revokes active tokens
 */
const revokeTokensByOwnership = async (ownershipId) => {
  return downloadsRepository.revokeTokensByOwnership(ownershipId);
};

/**
 * Cleans expired tokens
 */
const cleanupExpiredTokens = async () => {
  return downloadsRepository.deleteExpiredTokens();
};

module.exports = {
  requestDownloadToken,
  executeDownload,
  revokeTokensByOwnership,
  cleanupExpiredTokens
};
