const express = require("express");
const controller = require("./users.controller");
const catchAsync = require("../../utils/catchAsync");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", requireAdmin, catchAsync(controller.getAllUsers));
router.get("/:id", catchAsync(controller.getUser));
router.post("/", requireAdmin, catchAsync(controller.createUser));
router.put("/:id", catchAsync(controller.updateUser));
router.patch("/:id/status", requireAdmin, catchAsync(controller.updateUserStatus));

module.exports = router;
