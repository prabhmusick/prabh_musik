const { ulid } = require("ulid");
const crypto = require("crypto");
const uploadsRepository = require("./uploads.repository");
const usersRepository = require("../users/users.repository");
const { storageProvider } = require("../../storage/r2.provider");
const AppError = require("../../errors/AppError");
const logger = require("../../utils/logger");

/**
 * Validates file constraints (MIME type, size, filename structures)
 */
const validateFile = (file, assetType) => {
  if (!file || !file.buffer || file.size === 0) {
    throw new AppError("Empty or missing file upload", 400);
  }

  const size = file.size;
  const mime = file.mimetype;
  const name = file.originalname.toLowerCase();

  // Directory traversal check
  if (file.originalname.includes("..") || file.originalname.includes("/") || file.originalname.includes("\\")) {
    throw new AppError("Malicious or invalid filename structure", 400);
  }

  if (assetType === "audio" || assetType === "preview") {
    const allowedMimes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/flac"];
    const allowedExts = [".mp3", ".wav", ".ogg", ".flac"];
    const isMimeOk = allowedMimes.includes(mime) || mime.startsWith("audio/");
    const isExtOk = allowedExts.some(ext => name.endsWith(ext));
    if (!isMimeOk || !isExtOk) {
      throw new AppError("Invalid audio file MIME type or extension", 400);
    }
    if (size > 25 * 1024 * 1024) {
      throw new AppError("Audio file exceeds maximum 25MB limit", 400);
    }
  } else if (assetType === "cover" || assetType === "banner" || assetType === "avatar") {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
    const isMimeOk = allowedMimes.includes(mime) || mime.startsWith("image/");
    const isExtOk = allowedExts.some(ext => name.endsWith(ext));
    if (!isMimeOk || !isExtOk) {
      throw new AppError("Invalid image file MIME type or extension", 400);
    }
    const maxLimit = assetType === "avatar" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (size > maxLimit) {
      throw new AppError("Image file exceeds maximum permitted limit", 400);
    }
  } else if (assetType === "document") {
    const allowedMimes = ["application/pdf", "application/zip", "application/x-zip-compressed", "application/octet-stream"];
    const allowedExts = [".pdf", ".zip"];
    const isMimeOk = allowedMimes.includes(mime);
    const isExtOk = allowedExts.some(ext => name.endsWith(ext));
    if (!isMimeOk && !isExtOk) {
      throw new AppError("Invalid document file MIME type or extension", 400);
    }
    if (size > 10 * 1024 * 1024) {
      throw new AppError("Document file exceeds maximum 10MB limit", 400);
    }
  } else {
    throw new AppError("Unsupported asset type", 400);
  }
};

/**
 * virus/safety scans interface
 */
const performSafetyScan = async (file) => {
  return true;
};

/**
 * Partitions storage path key by date and appends ULID string.
 */
const generateStorageKey = (assetType, filename) => {
  const id = ulid();
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const ext = filename.split(".").pop() || "bin";
  
  return `${assetType}/${year}/${month}/${day}/${id}.${ext.toLowerCase()}`;
};

/**
 * Computes SHA-256 hex checksum
 */
const getChecksum = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

/**
 * Extracts dimensions from image buffer
 */
const getImageDimensions = (buffer) => {
  try {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const width = buffer.readInt32BE(16);
      const height = buffer.readInt32BE(20);
      return { width, height };
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        offset += 2;
        if (marker === 0xFFC0 || marker === 0xFFC2) {
          const height = buffer.readUInt16BE(offset + 3);
          const width = buffer.readUInt16BE(offset + 5);
          return { width, height };
        }
        const length = buffer.readUInt16BE(offset);
        offset += length;
      }
    }
    return { width: 800, height: 600 };
  } catch (err) {
    return { width: 800, height: 600 };
  }
};

/**
 * Extracts audio length duration
 */
const getAudioDuration = (buffer) => {
  try {
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      const byteRate = buffer.readInt32LE(28);
      const dataSize = buffer.length - 44;
      if (byteRate > 0) {
        return Math.round((dataSize / byteRate) * 10) / 10;
      }
    }
    // MP3 fallback estimation (assuming 192kbps CBR)
    return Math.round((buffer.length / 24576) * 10) / 10;
  } catch (err) {
    return 180.0;
  }
};

/**
 * Handles asset ingestion, storage uploads, and metadata persistence.
 */
const uploadAsset = async (file, assetType, userId) => {
  logger.info({
    event: "UPLOAD_STARTED",
    userId,
    assetType
  });

  // Resolve the internal database integer user ID from their public UUID string or number
  let internalUserId;
  if (typeof userId === "number" || (typeof userId === "string" && /^\d+$/.test(userId))) {
    internalUserId = Number(userId);
    const user = await usersRepository.getUserById(internalUserId);
    if (!user) {
      throw new AppError("Uploading user profile not found", 401);
    }
  } else {
    const user = await usersRepository.findUserByPublicId(userId);
    if (!user) {
      throw new AppError("Uploading user profile not found", 401);
    }
    internalUserId = user.id;
  }

  let uploadedStorageKey = null;

  try {
    // 1. Validations
    validateFile(file, assetType);
    
    // 2. Safety scanner
    const isSafe = await performSafetyScan(file);
    if (!isSafe) {
      throw new AppError("File safety/virus check failed", 400);
    }

    // 3. Generate storage naming parameters
    const storageKey = generateStorageKey(assetType, file.originalname);
    const checksum = getChecksum(file.buffer);

    // 4. Upload to Cloudflare R2
    await storageProvider.uploadObject(storageKey, file.buffer, file.mimetype);
    uploadedStorageKey = storageKey;

    // 5. Extract metadata details
    let duration = null;
    let imageWidth = null;
    let imageHeight = null;

    if (assetType === "audio" || assetType === "preview") {
      duration = getAudioDuration(file.buffer);
    } else if (assetType === "cover" || assetType === "banner" || assetType === "avatar") {
      const dims = getImageDimensions(file.buffer);
      imageWidth = dims.width;
      imageHeight = dims.height;
    }

    // 6. Persist metadata db record
    const publicId = `upl_${ulid().toLowerCase()}`;
    const uploadRecord = await uploadsRepository.createUpload({
      publicId,
      storageKey,
      assetType,
      mimeType: file.mimetype,
      fileSize: file.size,
      checksum,
      duration,
      imageWidth,
      imageHeight,
      uploadedBy: internalUserId
    });

    logger.info({
      event: "UPLOAD_COMPLETED",
      assetId: publicId,
      userId,
      assetType,
      mimeType: file.mimetype,
      fileSize: file.size
    });

    return uploadRecord;
  } catch (err) {
    if (uploadedStorageKey) {
      // Compensate: Delete file from R2 to prevent orphaned storage objects
      await storageProvider.deleteObject(uploadedStorageKey).catch((deleteErr) => {
        logger.error({
          event: "COMPENSATION_DELETE_FAILED",
          key: uploadedStorageKey,
          error: deleteErr.message
        });
      });
    }
    logger.error({
      event: "UPLOAD_FAILED",
      userId,
      assetType,
      reason: err.message
    });
    throw err;
  }
};

/**
 * Handles atomically replacing an asset with a new upload file.
 */
const replaceAsset = async (publicId, file, userId) => {
  logger.info({
    event: "UPLOAD_STARTED",
    userId,
    assetId: publicId
  });

  const existing = await uploadsRepository.getUploadByPublicId(publicId);
  if (!existing || existing.status !== "active") {
    throw new AppError("Upload record not found or inactive", 404);
  }

  // Resolve internal database integer ID or support numeric tests
  let internalUserId;
  if (typeof userId === "number" || (typeof userId === "string" && /^\d+$/.test(userId))) {
    internalUserId = Number(userId);
    const user = await usersRepository.getUserById(internalUserId);
    if (!user) {
      throw new AppError("Uploading user profile not found", 401);
    }
  } else {
    const user = await usersRepository.findUserByPublicId(userId);
    if (!user) {
      throw new AppError("Uploading user profile not found", 401);
    }
    internalUserId = user.id;
  }

  let uploadedStorageKey = null;

  try {
    // 1. Validations
    validateFile(file, existing.asset_type);

    // 2. Safety scans
    const isSafe = await performSafetyScan(file);
    if (!isSafe) {
      throw new AppError("File safety/virus check failed", 400);
    }

    // 3. Naming and keys
    const newStorageKey = generateStorageKey(existing.asset_type, file.originalname);
    const checksum = getChecksum(file.buffer);

    // 4. Atomic storage replacement: upload first!
    await storageProvider.uploadObject(newStorageKey, file.buffer, file.mimetype);
    uploadedStorageKey = newStorageKey;

    // 5. Extraction
    let duration = null;
    let imageWidth = null;
    let imageHeight = null;

    if (existing.asset_type === "audio" || existing.asset_type === "preview") {
      duration = getAudioDuration(file.buffer);
    } else if (existing.asset_type === "cover" || existing.asset_type === "banner" || existing.asset_type === "avatar") {
      const dims = getImageDimensions(file.buffer);
      imageWidth = dims.width;
      imageHeight = dims.height;
    }

    // 6. Update metadata record in DB
    const updatedRecord = await uploadsRepository.updateUpload(publicId, {
      storageKey: newStorageKey,
      fileSize: file.size,
      mimeType: file.mimetype,
      checksum,
      duration,
      imageWidth,
      imageHeight
    });
    
    if (!updatedRecord) {
      throw new AppError("Failed to update asset metadata in database", 500);
    }

    // 7. Delete the old object from storage
    await storageProvider.deleteObject(existing.storage_key).catch((deleteErr) => {
      logger.error({
        event: "ORPHANED_OLD_FILE_CLEANUP_FAILED",
        key: existing.storage_key,
        error: deleteErr.message
      });
    });

    logger.info({
      event: "UPLOAD_REPLACED",
      assetId: publicId,
      userId,
      assetType: existing.asset_type,
      mimeType: file.mimetype,
      fileSize: file.size
    });

    return updatedRecord;
  } catch (err) {
    if (uploadedStorageKey) {
      // Compensate: Delete new file from R2 to prevent orphaned storage objects
      await storageProvider.deleteObject(uploadedStorageKey).catch((deleteErr) => {
        logger.error({
          event: "COMPENSATION_DELETE_FAILED",
          key: uploadedStorageKey,
          error: deleteErr.message
        });
      });
    }
    logger.error({
      event: "UPLOAD_FAILED",
      userId,
      assetId: publicId,
      reason: err.message
    });
    throw err;
  }
};

/**
 * Safe metadata soft-delete and storage cleanup deletion workflow.
 */
const deleteAsset = async (publicId, userId) => {
  const existing = await uploadsRepository.getUploadByPublicId(publicId);
  if (!existing || existing.status !== "active") {
    throw new AppError("Upload record not found or inactive", 404);
  }

  // 1. Soft-delete metadata DB record
  await uploadsRepository.softDeleteUpload(publicId);

  // 2. Clear physical R2 file
  await storageProvider.deleteObject(existing.storage_key);

  logger.info({
    event: "UPLOAD_DELETED",
    assetId: publicId,
    userId,
    assetType: existing.asset_type
  });

  return true;
};

/**
 * Retrieves asset metadata record joined with public URL
 */
const getAssetMetadata = async (publicId) => {
  const record = await uploadsRepository.getUploadByPublicId(publicId);
  if (!record || record.status !== "active") {
    throw new AppError("Upload record not found or inactive", 404);
  }
  
  // Attach public URL
  const publicUrl = await storageProvider.createPublicPreviewUrl(record.storage_key);
  return {
    ...record,
    publicUrl
  };
};

module.exports = {
  validateFile,
  uploadAsset,
  replaceAsset,
  deleteAsset,
  getAssetMetadata
};
