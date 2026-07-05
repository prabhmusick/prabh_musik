const service = require("./ownerships.service");

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
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    return next(err);
  }
};

const getOwnershipsByUser = async (req, res, next) => {
  try {
    const list = await service.getOwnershipsByUser(req.params.id);
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
    const userId = req.user ? req.user.id : 1;
    const { page, pageSize, sort, order } = req.query;
    const library = await service.getLibraryByUser(userId, page, pageSize, sort, order);
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
