const express = require("express");
const multer = require("multer");
const controller = require("./uploads.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { rateLimit } = require("../../middleware/rateLimit.middleware");
const catchAsync = require("../../utils/catchAsync");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB
  }
});

// Authenticate and authorize administrators
router.use(authMiddleware);
router.use(requireAdmin);

// Rate limiter for uploads
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many upload requests, please try again later."
});
router.use(uploadRateLimiter);

const AppError = require("../../errors/AppError");

const handleUpload = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            if (fieldName === "audio") {
              return next(new AppError("Audio file exceeds maximum 25MB limit", 400));
            }
            return next(new AppError("File size exceeds maximum permitted limit", 400));
          }
          return next(new AppError(`File upload error: ${err.message}`, 400));
        }
        return next(err);
      }
      if (req.headers["x-original-filename"] && req.file) {
        req.file.originalname = req.headers["x-original-filename"];
      }
      next();
    });
  };
};

// Route configuration
router.post(
  "/audio",
  handleUpload("audio"),
  catchAsync(controller.uploadAudio)
);

router.post(
  "/image",
  handleUpload("image"),
  catchAsync(controller.uploadImage)
);

router.post(
  "/banner",
  handleUpload("banner"),
  catchAsync(controller.uploadBanner)
);

router.patch(
  "/:publicId",
  handleUpload("file"),
  catchAsync(controller.replaceAsset)
);

router.delete(
  "/:publicId",
  catchAsync(controller.deleteAsset)
);

router.get(
  "/:publicId",
  catchAsync(controller.getAssetMetadata)
);

module.exports = router;
