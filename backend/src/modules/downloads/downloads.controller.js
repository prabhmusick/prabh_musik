const downloadsService = require("./downloads.service");

/**
 * Request download token route handler
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
 * Secure file delivery download redirect handler
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

module.exports = {
  requestDownload,
  downloadFile
};
