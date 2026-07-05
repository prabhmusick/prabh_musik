const service = require("./users.service");

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
 * Lists all users
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
 * Retrieves a single user by ID
 * GET /api/users/:id
 */
const getUser = async (req, res) => {
  const user = await service.getUser(req.params.id);
  res.json({
    success: true,
    data: user
  });
};

/**
 * Updates a user record dynamically
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  const user = await service.updateUser(req.params.id, req.body);
  res.json({
    success: true,
    data: user
  });
};

/**
 * Updates user block status
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
