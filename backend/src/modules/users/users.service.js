const repository = require("./users.repository");
const validator = require("./users.validator");
const AppError = require("../../errors/AppError");
const bcrypt = require("bcrypt");

/**
 * Fetches a single user record by ID or throws a 404 AppError
 */
const getUser = async (id) => {
  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  const user = await repository.getUserById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

/**
 * Creates a new user record.
 */
const createUser = async (userData) => {
  const validated = validator.validateCreateUser(userData);

  // Check email conflict
  const existingUser = await repository.getUserByEmail(validated.email);
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  // Hash password with bcrypt before persisting
  validated.password = await bcrypt.hash(validated.password, 10);

  const id = await repository.createUser(validated);
  return repository.getUserById(id);
};

/**
 * Fetches all user records
 */
const getAllUsers = async () => {
  return repository.getAllUsers();
};

/**
 * Updates properties of a user record.
 */
const updateUser = async (id, updates) => {
  const existingUser = await getUser(id);
  const cleanUpdates = validator.validateUpdateUser(updates);

  // Check email conflict if email is changing
  if (cleanUpdates.email && cleanUpdates.email !== existingUser.email) {
    const emailConflict = await repository.getUserByEmail(cleanUpdates.email);
    if (emailConflict) {
      throw new AppError("Email already registered by another user", 409);
    }
  }

  // Hash password if updated
  if (cleanUpdates.password) {
    cleanUpdates.password = await bcrypt.hash(cleanUpdates.password, 10);
  }

  if (Object.keys(cleanUpdates).length === 0) {
    return existingUser;
  }

  const success = await repository.updateUser(id, cleanUpdates);
  if (!success) {
    throw new AppError("No changes were made or user update failed", 400);
  }

  return repository.getUserById(id);
};

/**
 * Updates status specifically.
 */
const updateUserStatus = async (id, statusData) => {
  await getUser(id); // Throws 404 if not found
  const { status } = validator.validateStatusUpdate(statusData);

  const success = await repository.updateUser(id, { status });
  if (!success) {
    throw new AppError("Status update failed", 400);
  }

  return repository.getUserById(id);
};

module.exports = {
  createUser,
  getUser,
  getAllUsers,
  updateUser,
  updateUserStatus
};
