/**
 * @fileoverview Users Router Module
 * Declares HTTP URL path mappings for the User domain module.
 */

const express = require("express");
const controller = require("./users.controller");

const router = express.Router();

// POST /api/users - Creates a new user profile record
router.post("/", controller.createUser);

module.exports = router;
