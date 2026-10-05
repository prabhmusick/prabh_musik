const service = require("./ownerships.service");
const usersRepository = require("../users/users.repository");
const AppError = require("../../errors/AppError");

const getOwnerships = async (req, res, next) => {
  try {
    const list = await service.getAllOwnerships();
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    return next(err);
  }
};

const getOwnershipById = async (req, res, next) => {
  try {
    const record = await service.getOwnership(req.params.id);
    if (req.user.role !== "admin") {
      const customer = (await usersRepository.getUserById(req.user.id)) || (await usersRepository.findUserByPublicId(req.user.id));
      if (!customer || Number(record.user_id) !== Number(customer.id)) {
        return next(new AppError("Access denied.", 403));
      }
    }
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    return next(err);
  }
};

const getOwnershipsByUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (req.user.role !== "admin") {
      const customer = (await usersRepository.getUserById(req.user.id)) || (await usersRepository.findUserByPublicId(req.user.id));
      if (!customer || (String(targetUserId) !== String(customer.id) && String(targetUserId) !== String(customer.public_id))) {
        return next(new AppError("Access denied.", 403));
      }
    }
    const list = await service.getOwnershipsByUser(targetUserId);
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    return next(err);
  }
};

const getOwnershipsByBeat = async (req, res, next) => {
  try {
    const list = await service.getOwnershipsByBeat(req.params.id);
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    return next(err);
  }
};

const incrementDownloads = async (req, res, next) => {
  try {
    const record = await service.getOwnership(req.params.id);
    if (req.user.role !== "admin") {
      const customer = (await usersRepository.getUserById(req.user.id)) || (await usersRepository.findUserByPublicId(req.user.id));
      if (!customer || Number(record.user_id) !== Number(customer.id)) {
        return next(new AppError("Access denied.", 403));
      }
    }
    const statusResult = await service.incrementDownloads(req.params.id);
    return res.status(200).json({ success: true, data: statusResult });
  } catch (err) {
    return next(err);
  }
};

const updateExpiry = async (req, res, next) => {
  try {
    const updated = await service.updateExpiry(req.params.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
};

const revokeOwnership = async (req, res, next) => {
  try {
    const updated = await service.revokeOwnership(req.params.id);
    return res.status(200).json({ success: true, message: "Ownership revoked successfully", data: updated });
  } catch (err) {
    return next(err);
  }
};

const getLibraryByUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(new AppError("Authentication required.", 401));
    }
    const customer = (await usersRepository.getUserById(req.user.id)) || (await usersRepository.findUserByPublicId(req.user.id));
    if (!customer) {
      return next(new AppError("User profile not found", 404));
    }

    const { page, pageSize, sort, order } = req.query;
    const library = await service.getLibraryByUser(customer.id, page, pageSize, sort, order);
    return res.status(200).json({ success: true, data: library });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getOwnerships,
  getOwnershipById,
  getOwnershipsByUser,
  getOwnershipsByBeat,
  incrementDownloads,
  updateExpiry,
  revokeOwnership,
  getLibraryByUser
};
