const service = require("./users.service");
const AppError = require("../../errors/AppError");

/**
 * Creates a new user record (HTTP 201)
 * POST /api/users
 */
const createUser = async (req, res) => {
  const user = await service.createUser(req.body);
  res.status(201).json({
    success: true,
    data: user
  });
};

/**
 * Lists all users (Admin only)
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
  const users = await service.getAllUsers();
  res.json({
    success: true,
    count: users.length,
    data: users
  });
};

/**
 * Retrieves a single user by ID (Self or Admin)
 * GET /api/users/:id
 */
const getUser = async (req, res) => {
  const targetId = req.params.id;
  const user = await service.getUser(targetId);

  // Self or admin check
  if (req.user.role !== "admin") {
    if (String(req.user.id) !== String(user.id) && String(req.user.id) !== String(user.public_id)) {
      throw new AppError("Access denied.", 403);
    }
  }

  res.json({
    success: true,
    data: user
  });
};

/**
 * Updates a user record dynamically (Self or Admin)
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  const targetId = req.params.id;
  const existingUser = await service.getUser(targetId);

  // Self or admin check
  if (req.user.role !== "admin") {
    if (String(req.user.id) !== String(existingUser.id) && String(req.user.id) !== String(existingUser.public_id)) {
      throw new AppError("Access denied.", 403);
    }
  }

  const user = await service.updateUser(targetId, req.body);
  res.json({
    success: true,
    data: user
  });
};

/**
 * Updates user block status (Admin only)
 * PATCH /api/users/:id/status
 */
const updateUserStatus = async (req, res) => {
  const user = await service.updateUserStatus(req.params.id, req.body);
  res.json({
    success: true,
    data: user
  });
};

module.exports = {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  updateUserStatus
};
