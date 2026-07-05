const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const r2 = require("../config/r2");

// console.log("========== R2 DEBUG ==========");
// console.log(r2);
// console.log("Constructor:", r2?.constructor?.name);
// console.log("typeof send:", typeof r2.send);
// console.log("==============================");

/**
 * Uploads a file buffer directly to the Cloudflare R2 bucket.
 * 
 * @param {Buffer} buffer - Raw file buffer contents
 * @param {string} key - Target file name/path key in the bucket
 * @param {string} mimetype - File content type (e.g. audio/mpeg, image/jpeg)
 * @returns {Promise<object>} S3 SDK put command output response
 */
const uploadFile = async (buffer, key, mimetype) => {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype
  });
  return r2.send(command);
};

/**
 * Deletes a file key from the Cloudflare R2 bucket.
 * 
 * @param {string} key - Path key inside the bucket
 * @returns {Promise<object>} S3 SDK delete command output response
 */
const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key
  });
  return r2.send(command);
};

/**
 * Downloads a file key from R2 and converts its readable stream to a Buffer.
 * Useful for serving media files through API streams.
 * 
 * @param {string} key - File key to fetch
 * @returns {Promise<{buffer: Buffer, contentType: string}>} File content buffer and MIME type
 */
const getFile = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key
  });

  const response = await r2.send(command);

  // Helper function to resolve incoming readable streams to a Buffer
  const streamToBuffer = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });

  const buffer = await streamToBuffer(response.Body);
  return {
    buffer,
    contentType: response.ContentType
  };
};

/**
 * Lists keys inside the R2 bucket.
 * 
 * @param {object} options - Filter and pagination criteria (maxKeys, continuationToken, prefix)
 * @returns {Promise<object>} List metadata output
 */
const listFiles = async (options = {}) => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET,
    MaxKeys: options.maxKeys ? parseInt(options.maxKeys, 10) : 1000,
    ContinuationToken: options.continuationToken || undefined,
    Prefix: options.prefix || undefined
  });

  console.log({
    endpoint: process.env.R2_ENDPOINT,
    bucket: process.env.R2_BUCKET,
  });
  return r2.send(command);
};

module.exports = {
  uploadFile,
  deleteFile,
  getFile,
  listFiles
};
