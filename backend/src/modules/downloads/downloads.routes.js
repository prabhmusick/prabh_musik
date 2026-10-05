const express = require("express");
const controller = require("./downloads.controller");
const authMiddleware = require("../../middleware/auth.middleware");

const router = express.Router();

// Request download token (Requires authentication)
router.post("/:ownershipId/request", authMiddleware, controller.requestDownload);

// Stream delivery via pre-signed URL redirect
router.get("/:token", controller.downloadFile);

module.exports = router;
