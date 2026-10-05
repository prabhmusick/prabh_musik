const express = require("express");
const controller = require("./downloads.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { rateLimit } = require("../../middleware/rateLimit.middleware");

const router = express.Router();

// Define download endpoint rate limiting for customers
const downloadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,                 // Limit to 10 requests per 5 minutes
  message: "Too many download requests, please try again later."
});

// Admin endpoints (MUST be defined before wildcards)
router.get("/admin", authMiddleware, requireAdmin, controller.getAdminDownloadHistory);
router.get("/admin/:ownershipPublicId", authMiddleware, requireAdmin, controller.getAdminDownloadHistoryByOwnership);

// Customer endpoints
router.get("/history", authMiddleware, controller.getDownloadHistory);
router.get("/:ownershipPublicId", authMiddleware, downloadRateLimiter, controller.generateDownload);

// Legacy token endpoints (defined with unique prefix to avoid wildcard collisions)
router.post("/:ownershipId/request", controller.requestDownload);
router.get("/token/:token", controller.downloadFile);

module.exports = router;
