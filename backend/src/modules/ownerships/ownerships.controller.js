const service = require("./ownerships.service");
const AppError = require("../../errors/AppError");
const ERROR_CODES = require("../../config/errorCodes");

// GET /api/ownerships - Customer endpoint to get their own library
const getMyOwnerships = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, pageSize, sort, order } = req.query;
    const library = await service.getLibraryByUser(userId, page, pageSize, sort, order);
    return res.status(200).json({ success: true, data: library });
  } catch (err) {
    return next(err);
  }
};

// GET /api/ownerships/:publicId - Customer / Admin lookup endpoint
const getOwnershipByPublicId = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    const record = await service.getOwnershipByPublicId(publicId);

    // Enforce owner check: must be owner or admin
    if (record.user_id !== req.user.id && req.user.role !== "admin") {
      const err = new AppError("Access denied. You do not own this license.", 403);
      err.errorCode = ERROR_CODES.FORBIDDEN;
      return next(err);
    }

    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    return next(err);
  }
};

// GET /api/ownerships/admin - Admin endpoint to list all active ownership records
const getOwnershipsAdmin = async (req, res, next) => {
  try {
    const list = await service.getAllOwnerships();
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/ownerships/:publicId - Admin endpoint to update ownership expiry
const updateExpiryByPublicId = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    const ownership = await service.getOwnershipByPublicId(publicId);
    const updated = await service.updateExpiry(ownership.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/ownerships/:publicId - Admin endpoint to soft-revoke / deactivate license
const revokeOwnershipByPublicId = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    const ownership = await service.getOwnershipByPublicId(publicId);
    const updated = await service.revokeOwnership(ownership.id);
    return res.status(200).json({
      success: true,
      message: "Ownership revoked successfully",
      data: updated
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/ownerships/:publicId/download - Download increment action API
const incrementDownloads = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    const ownership = await service.getOwnershipByPublicId(publicId);
    const statusResult = await service.incrementDownloads(ownership.id);
    return res.status(200).json({ success: true, data: statusResult });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getMyOwnerships,
  getOwnershipByPublicId,
  getOwnershipsAdmin,
  updateExpiryByPublicId,
  revokeOwnershipByPublicId,
  incrementDownloads
};
