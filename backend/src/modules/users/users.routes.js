const express = require("express");
const controller = require("./users.controller");
const catchAsync = require("../../utils/catchAsync");

const router = express.Router();

router.get("/", catchAsync(controller.getAllUsers));
router.get("/:id", catchAsync(controller.getUser));
router.post("/", catchAsync(controller.createUser));
router.put("/:id", catchAsync(controller.updateUser));
router.patch("/:id/status", catchAsync(controller.updateUserStatus));

module.exports = router;
