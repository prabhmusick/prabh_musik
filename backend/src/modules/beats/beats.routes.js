/**
 * @fileoverview Beats Router Module
 * Declares HTTP URL path mappings and attaches middleware for the Beats domain module.
 */

const express = require("express");
const controller = require("./beats.controller");
const { rateLimit } = require("../../middleware/rateLimit.middleware");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");

const router = express.Router();

const catalogRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many catalog requests, please try again later."
});

// 1. POST / - Creates a new beat record (Admin Only)
router.post("/", authMiddleware, requireAdmin, controller.createBeat);

// 2. GET / - Lists published beats for the storefront catalog
router.get("/", catalogRateLimiter, controller.listPublicBeats);

// 3. GET /admin - Lists all beats (drafts, published, archived) for admin view (Admin Only)
router.get("/admin", authMiddleware, requireAdmin, controller.listAdminBeats);

// 4. GET /slug/:slug - Retrieves a single published beat by its SEO slug
router.get("/slug/:slug", catalogRateLimiter, controller.getBeatBySlug);

// 5. GET /:publicId - Retrieves a single beat record by public_id
router.get("/:publicId", catalogRateLimiter, controller.getBeatByPublicId);

// 6. PATCH /:publicId - Updates a beat record partially (Admin Only)
router.patch("/:publicId", authMiddleware, requireAdmin, controller.updateBeat);

// 7. PATCH /:publicId/status - Updates a beat's lifecycle status (Admin Only)
router.patch("/:publicId/status", authMiddleware, requireAdmin, controller.updateStatus);

module.exports = router;
