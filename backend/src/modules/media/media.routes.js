const express = require("express");
const router = express.Router();
const controller = require("./media.controller");

// GET /api/media?key=<storage-key>
router.get("/", controller.streamMedia);

module.exports = router;
