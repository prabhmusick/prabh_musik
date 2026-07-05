const express = require("express");
const controller = require("./downloads.controller");

const router = express.Router();

// Request download token (Auth middleware stubbed/ignored for direct testing)
router.post("/:ownershipId/request", controller.requestDownload);

// Stream delivery via pre-signed URL redirect
router.get("/:token", controller.downloadFile);

module.exports = router;
