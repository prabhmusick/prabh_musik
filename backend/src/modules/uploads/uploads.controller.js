const uploadsService = require("./uploads.service");
const AppError = require("../../errors/AppError");

const uploadAudio = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const type = req.query.type || "audio";
    if (type !== "audio" && type !== "preview") {
      throw new AppError("Invalid type query. Use type=audio or type=preview.", 400);
    }
    const result = await uploadsService.uploadAsset(req.file, type, userId);
    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const uploadImage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const type = req.query.type || "cover";
    if (type !== "cover" && type !== "avatar") {
      throw new AppError("Invalid type query. Use type=cover or type=avatar.", 400);
    }
    const result = await uploadsService.uploadAsset(req.file, type, userId);
    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const uploadBanner = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await uploadsService.uploadAsset(req.file, "banner", userId);
    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const replaceAsset = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { publicId } = req.params;
    const result = await uploadsService.replaceAsset(publicId, req.file, userId);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { publicId } = req.params;
    await uploadsService.deleteAsset(publicId, userId);
    return res.status(200).json({
      success: true,
      message: "Asset deleted successfully"
    });
  } catch (err) {
    next(err);
  }
};

const getAssetMetadata = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    const result = await uploadsService.getAssetMetadata(publicId);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadAudio,
  uploadImage,
  uploadBanner,
  replaceAsset,
  deleteAsset,
  getAssetMetadata
};
