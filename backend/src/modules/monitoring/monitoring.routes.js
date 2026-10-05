/**
 * @fileoverview Monitoring Endpoints Router
 * Exposes metrics & dashboard data for administrative systems.
 */

const express = require("express");
const controller = require("./monitoring.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { rateLimit } = require("../../middleware/rateLimit.middleware");

const router = express.Router();

// Administrative Observability endpoint protection
router.use(authMiddleware);
router.use(requireAdmin);

const monitorRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100,
  message: "Too many monitoring request hits. Rate-limited."
});
router.use(monitorRateLimiter);

router.get("/metrics", controller.getMetrics);
router.get("/dashboard", controller.getMetrics);

module.exports = router;
