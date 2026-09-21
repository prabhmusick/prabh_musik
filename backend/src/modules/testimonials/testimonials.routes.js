const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const controller = require("./testimonials.controller");

const router = express.Router();

router.get("/", controller.listTestimonials);
router.post("/", authMiddleware, requireAdmin, controller.createTestimonial);
router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  controller.deleteTestimonial,
);

module.exports = router;
