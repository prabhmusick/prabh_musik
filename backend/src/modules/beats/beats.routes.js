const express = require("express");
const controller = require("./beats.controller");
const catchAsync = require("../../utils/catchAsync");

const router = express.Router();

router.get("/object/:key", catchAsync(controller.getBeatObject));
router.get("/", catchAsync(controller.getAllBeats));
router.get("/:id", catchAsync(controller.getBeat));
router.post("/", catchAsync(controller.createBeat));
router.put("/:id", catchAsync(controller.updateBeat));
router.delete("/:id", catchAsync(controller.archiveBeat));

module.exports = router;
