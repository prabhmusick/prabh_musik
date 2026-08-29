/**
 * @fileoverview Users Controller Layer
 * Handles incoming HTTP request parsing, syntactic validation, and standardized HTTP responses.
 */

const service = require("./users.service");

/**
 * Validates the HTTP request body and dispatches the payload to the Users Service.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware reference.
 * @returns {Promise<void>} Resolves when the HTTP response has been sent.
 */
const createUser = async (req, res, next) => {
  const { name, email, mobile, avatar_key, address } = req.body || {};

  const validationErrors = [];

  // 1. Syntactic HTTP Validation: Field Presence & Types
  if (name === undefined || name === null) {
    validationErrors.push({ field: "name", message: "Name is required." });
  } else if (typeof name !== "string") {
    validationErrors.push({ field: "name", message: "Name must be a string." });
  }

  if (email === undefined || email === null) {
    validationErrors.push({ field: "email", message: "Email is required." });
  } else if (typeof email !== "string") {
    validationErrors.push({ field: "email", message: "Email must be a string." });
  } else {
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      validationErrors.push({ field: "email", message: "Email format is invalid." });
    }
  }

  // 2. If validation fails, return HTTP 400 with structured validation payload
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed.",
        details: validationErrors
      }
    });
  }

  try {
    // 3. Delegate to Service Layer
    const user = await service.createUser({ name, email, mobile, avatar_key, address });

    // 4. Return standard HTTP 201 Created response
    res.status(201).json({
      success: true,
      data: {
        public_id: user.public_id,
        email: user.email,
        name: user.name,
        mobile: user.mobile,
        avatar_key: user.avatar_key,
        address: user.address,
        role: user.role,
        status: user.status,
        created_at: user.created_at
      }
    });
  } catch (error) {
    // 5. Delegate database conflicts and unexpected failures to the Express global error-handler
    next(error);
  }
};

/**
 * Lists all user profiles (admin-facing).
 */
const listUsers = async (req, res, next) => {
  try {
    const users = await service.listUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUser,
  listUsers
};


