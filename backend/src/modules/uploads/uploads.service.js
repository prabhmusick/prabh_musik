const r2Service = require("../../storage/r2.service");

/**
 * Clean original filename to prevent S3 command problems
 * 
 * @param {string} originalName - File's original filename
 * @returns {string} Safe filename key
 */
const getSafeFileName = (originalName) => {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${safeName}`;
};

/**
 * Validates and uploads audio files to Cloudflare R2
 */
const uploadAudioFile = async (file) => {
  if (!file) {
    const error = new Error("no file");
    error.status = 400;
    throw error;
  }

  if (!file.mimetype.startsWith("audio")) {
    const error = new Error("invalid file type");
    error.status = 400;
    throw error;
  }

  const fileName = getSafeFileName(file.originalname);
  await r2Service.uploadFile(file.buffer, fileName, file.mimetype);

  return {
    success: true,
    fileName
  };
};

/**
 * Validates and uploads image files (covers/banners) to Cloudflare R2
 */
const uploadImageFile = async (file) => {
  if (!file) {
    const error = new Error("no file");
    error.status = 400;
    throw error;
  }

  if (!file.mimetype.startsWith("image")) {
    const error = new Error("invalid file type");
    error.status = 400;
    throw error;
  }

  const fileName = getSafeFileName(file.originalname);
  await r2Service.uploadFile(file.buffer, fileName, file.mimetype);

  return {
    success: true,
    fileName
  };
};

/**
 * Validates and uploads document files (ZIP stems) to Cloudflare R2
 */
const uploadDocumentFile = async (file) => {
  if (!file) {
    const error = new Error("no file");
    error.status = 400;
    throw error;
  }

  // ZIP stems may have applications MIME typings (like application/zip, application/x-zip-compressed)
  const allowedMimePrefixes = ["application/zip", "application/x-zip-compressed", "application/octet-stream"];
  const isZip = allowedMimePrefixes.some(mime => file.mimetype.includes(mime)) || file.originalname.endsWith(".zip");

  if (!isZip) {
    const error = new Error("invalid file type: only zip stem packages are allowed");
    error.status = 400;
    throw error;
  }

  const fileName = getSafeFileName(file.originalname);
  await r2Service.uploadFile(file.buffer, fileName, file.mimetype);

  return {
    success: true,
    fileName
  };
};

module.exports = {
  uploadAudioFile,
  uploadImageFile,
  uploadDocumentFile
};
