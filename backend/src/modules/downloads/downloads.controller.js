const downloadsService = require("./downloads.service");

/**
 * Request download token route handler (Legacy)
 */
const requestDownload = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1; // Fallback for test flows
    const ownershipId = parseInt(req.params.ownershipId, 10);

    const result = await downloadsService.requestDownloadToken(userId, ownershipId);
    
    // Construct public download endpoint link
    const downloadUrl = `${req.protocol}://${req.get("host")}/api/downloads/${result.token}`;

    return res.status(200).json({
      success: true,
      downloadUrl,
      expiresIn: result.expiresIn
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Secure file delivery download redirect handler (Legacy)
 */
const downloadFile = async (req, res, next) => {
  try {
    const { token } = req.params;
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const ua = req.get("User-Agent") || "Unknown";

    const { presignedUrl } = await downloadsService.executeDownload(token, ip, ua);

    // Issue temporary redirect directly to R2 object URL
    return res.redirect(302, presignedUrl);
  } catch (err) {
    next(err);
  }
};

/**
 * Generate signed direct download URL (Sprint 9 GET /api/downloads/:ownershipPublicId)
 */
const generateDownload = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { ownershipPublicId } = req.params;
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const ua = req.get("User-Agent") || "Unknown";

    const result = await downloadsService.generateDownload(userId, ownershipPublicId, ip, ua);

    return res.status(200).json({
      success: true,
      downloadUrl: result.downloadUrl
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get download history for authenticated customer (Sprint 9 GET /api/downloads/history)
 */
const getDownloadHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await downloadsService.getDownloadHistoryByUser(userId);
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all download logs for administrators (Sprint 9 GET /api/downloads/admin)
 */
const getAdminDownloadHistory = async (req, res, next) => {
  try {
    const history = await downloadsService.getAllDownloadHistory();
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get download history specifically for a given license public ID (Sprint 9 GET /api/downloads/admin/:ownershipPublicId)
 */
const getAdminDownloadHistoryByOwnership = async (req, res, next) => {
  try {
    const { ownershipPublicId } = req.params;
    const history = await downloadsService.getDownloadHistoryByPublicId(ownershipPublicId);
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requestDownload,
  downloadFile,
  generateDownload,
  getDownloadHistory,
  getAdminDownloadHistory,
  getAdminDownloadHistoryByOwnership
};
