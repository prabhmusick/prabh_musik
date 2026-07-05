const AppError = require("../../errors/AppError");

const ROLE_WHITELIST = ["admin", "customer"];
const STATUS_WHITELIST = ["active", "blocked"];

const cleanString = (value) => 
  typeof value === "string" ? value.trim() : value;

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validates payload parameters for user creation.
 * Throws AppError on schema violations.
 */
const validateCreateUser = (data) => {
  if (!data) {
    throw new AppError("No data provided", 400);
  }

  const name = cleanString(data.name);
  const email = cleanString(data.email);
  const password = data.password; // Can be a string

  if (!name) {
    throw new AppError("Name is required", 400);
  }
  if (!email) {
    throw new AppError("Email is required", 400);
  }
  if (!isValidEmail(email)) {
    throw new AppError("Invalid email address format", 400);
  }
  if (!password) {
    throw new AppError("Password is required", 400);
  }

  const role = cleanString(data.role) || "customer";
  if (!ROLE_WHITELIST.includes(role)) {
    throw new AppError(`Invalid role. Must be one of: ${ROLE_WHITELIST.join(", ")}`, 400);
  }

  const status = cleanString(data.status) || "active";
  if (!STATUS_WHITELIST.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${STATUS_WHITELIST.join(", ")}`, 400);
  }

  return {
    name,
    email,
    password: String(password),
    mobile: cleanString(data.mobile) || null,
    address: cleanString(data.address) || null,
    role,
    status
  };
};

/**
 * Validates payload parameters for user updates.
 * Throws AppError on schema violations.
 */
const validateUpdateUser = (data) => {
  if (!data) {
    throw new AppError("No data provided for update", 400);
  }

  const sanitized = {};

  if (data.name !== undefined) {
    const trimmed = cleanString(data.name);
    if (!trimmed) {
      throw new AppError("Name cannot be empty", 400);
    }
    sanitized.name = trimmed;
  }

  if (data.email !== undefined) {
    const trimmed = cleanString(data.email);
    if (!trimmed) {
      throw new AppError("Email cannot be empty", 400);
    }
    if (!isValidEmail(trimmed)) {
      throw new AppError("Invalid email address format", 400);
    }
    sanitized.email = trimmed;
  }

  if (data.password !== undefined) {
    if (data.password === null || String(data.password).trim() === "") {
      throw new AppError("Password cannot be empty", 400);
    }
    sanitized.password = String(data.password);
  }

  if (data.role !== undefined) {
    const role = cleanString(data.role);
    if (!ROLE_WHITELIST.includes(role)) {
      throw new AppError(`Invalid role. Must be one of: ${ROLE_WHITELIST.join(", ")}`, 400);
    }
    sanitized.role = role;
  }

  if (data.status !== undefined) {
    const status = cleanString(data.status);
    if (!STATUS_WHITELIST.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${STATUS_WHITELIST.join(", ")}`, 400);
    }
    sanitized.status = status;
  }

  if (data.mobile !== undefined) {
    sanitized.mobile = cleanString(data.mobile) || null;
  }

  if (data.address !== undefined) {
    sanitized.address = cleanString(data.address) || null;
  }

  return sanitized;
};

/**
 * Validates status payload.
 */
const validateStatusUpdate = (data) => {
  if (!data || data.status === undefined) {
    throw new AppError("Status is required", 400);
  }
  const status = cleanString(data.status);
  if (!STATUS_WHITELIST.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${STATUS_WHITELIST.join(", ")}`, 400);
  }
  return { status };
};

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateStatusUpdate
};
