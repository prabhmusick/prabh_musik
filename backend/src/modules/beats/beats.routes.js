const express = require("express");
const controller = require("./beats.controller");
const catchAsync = require("../../utils/catchAsync");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");

const router = express.Router();

router.get("/object/:key", catchAsync(controller.getBeatObject));
router.get("/", catchAsync(controller.getAllBeats));
router.get("/:id", catchAsync(controller.getBeat));
router.post("/", authMiddleware, requireAdmin, catchAsync(controller.createBeat));
router.put("/:id", authMiddleware, requireAdmin, catchAsync(controller.updateBeat));
router.delete("/:id", authMiddleware, requireAdmin, catchAsync(controller.archiveBeat));

module.exports = router;
