const service = require("./uploads.service");

/**
 * Express handler for audio uploads
 * POST /api/uploads/upload-audio
 */
const uploadAudio = async (req, res) => {
  const result = await service.uploadAudioFile(req.file);
  res.json(result);
};

/**
 * Express handler for image uploads
 * POST /api/uploads/upload-image
 */
const uploadImage = async (req, res) => {
  console.log("IMAGE ROUTE HIT");
  console.log(req.file);

  const result = await service.uploadImageFile(req.file);
  res.json(result);
};

/**
 * Express handler for document/ZIP uploads
 * POST /api/uploads/upload-document
 */
const uploadDocument = async (req, res) => {
  const result = await service.uploadDocumentFile(req.file);
  res.json(result);
};

module.exports = {
  uploadAudio,
  uploadImage,
  uploadDocument
};
