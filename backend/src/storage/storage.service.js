const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const r2 = require("../config/r2");

/**
 * decodes and normalizes file path keys
 */
const cleanKey = (key) => {
  return decodeURIComponent(key);
};

/**
 * Returns a readable stream for a file key from the bucket.
 *
 * @param {string} key - File object key
 * @returns {Promise<{stream: stream.Readable, mimeType: string}>} Node stream context
 */
const getDownloadStream = async (key) => {
  const targetKey = cleanKey(key);
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: targetKey
  });

  const response = await r2.send(command);
  return {
    stream: response.Body,
    mimeType: response.ContentType || "audio/mpeg"
  };
};

/**
 * Generates a short-lived presigned URL for secure direct downloads.
 *
 * @param {string} key - File object key
 * @param {number} expiresInSeconds - Token validity in seconds
 * @returns {Promise<string>} Signed download URL
 */
const generatePresignedDownloadUrl = async (key, expiresInSeconds = 300) => {
  const targetKey = cleanKey(key);
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: targetKey
  });

  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
};

/**
 * Uploads a buffer to storage
 */
const uploadFile = async (buffer, key, mimetype) => {
  const targetKey = cleanKey(key);
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: targetKey,
    Body: buffer,
    ContentType: mimetype
  });
  return r2.send(command);
};

/**
 * Deletes a file from storage
 */
const deleteFile = async (key) => {
  const targetKey = cleanKey(key);
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: targetKey
  });
  return r2.send(command);
};

module.exports = {
  getDownloadStream,
  generatePresignedDownloadUrl,
  uploadFile,
  deleteFile
};
