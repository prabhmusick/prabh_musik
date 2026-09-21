const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const controller = require("./artists.controller");

const router = express.Router();
router.get("/worked-with", controller.listWorkedWithArtists);
router.post(
  "/worked-with",
  authMiddleware,
  requireAdmin,
  controller.createWorkedWithArtist,
);
router.delete(
  "/worked-with/:id",
  authMiddleware,
  requireAdmin,
  controller.deleteWorkedWithArtist,
);
router.get("/", controller.listArtists);
router.post("/", authMiddleware, requireAdmin, controller.createArtist);

module.exports = router;
