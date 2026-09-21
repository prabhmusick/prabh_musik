const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const controller = require("./lyrics.controller");

const router = express.Router();

router.get("/", controller.listLyrics);
router.post("/", authMiddleware, requireAdmin, controller.createLyric);
router.delete("/:id", authMiddleware, requireAdmin, controller.deleteLyric);

module.exports = router;
