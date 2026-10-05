const express = require("express");
const controller = require("./ownerships.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware);

// Collection routes
router.get("/", requireAdmin, controller.getOwnerships);
router.get("/user/:id", controller.getOwnershipsByUser);
router.get("/beat/:id", requireAdmin, controller.getOwnershipsByBeat);

// Single record routes
router.get("/:id", controller.getOwnershipById);
router.patch("/:id/expiry", requireAdmin, controller.updateExpiry);
router.delete("/:id", requireAdmin, controller.revokeOwnership);

// Download increment POST action API
router.post("/:id/download", controller.incrementDownloads);

module.exports = router;
