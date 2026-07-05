const express = require("express");
const multer = require("multer");
const controller = require("./uploads.controller");
const catchAsync = require("../../utils/catchAsync");

const router = express.Router();

// Configure multer to hold files in memory before forwarding to R2 storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB size threshold limit
    },
});

// Audio Upload Route: POST /api/uploads/upload-audio (multipart key: audio)
router.post(
    "/upload-audio",
    upload.single("audio"),
    catchAsync(controller.uploadAudio)
);

// Image Upload Route: POST /api/uploads/upload-image (multipart key: image)
router.post(
    "/upload-image",
    upload.single("image"),
    catchAsync(controller.uploadImage)
);

// Document Upload Route: POST /api/uploads/upload-document (multipart key: document)
router.post(
    "/upload-document",
    upload.single("document"),
    catchAsync(controller.uploadDocument)
);

module.exports = router;
