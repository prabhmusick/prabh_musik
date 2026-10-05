const express = require("express");
const controller = require("./ownerships.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");

const router = express.Router();

// Admin endpoints
router.get("/admin", authMiddleware, requireAdmin, controller.getOwnershipsAdmin);
router.patch("/:publicId", authMiddleware, requireAdmin, controller.updateExpiryByPublicId);
router.delete("/:publicId", authMiddleware, requireAdmin, controller.revokeOwnershipByPublicId);

// Customer endpoints
router.get("/", authMiddleware, controller.getMyOwnerships);
router.get("/:publicId", authMiddleware, controller.getOwnershipByPublicId);

// Download increment POST action API
router.post("/:publicId/download", authMiddleware, controller.incrementDownloads);

module.exports = router;
