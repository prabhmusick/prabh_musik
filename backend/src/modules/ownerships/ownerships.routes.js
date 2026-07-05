const express = require("express");
const controller = require("./ownerships.controller");

const router = express.Router();

// Collection routes
router.get("/", controller.getOwnerships);
router.get("/user/:id", controller.getOwnershipsByUser);
router.get("/beat/:id", controller.getOwnershipsByBeat);

// Single record routes
router.get("/:id", controller.getOwnershipById);
router.patch("/:id/expiry", controller.updateExpiry);
router.delete("/:id", controller.revokeOwnership);

// Download increment POST action API
router.post("/:id/download", controller.incrementDownloads);

module.exports = router;
