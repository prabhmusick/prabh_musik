const { db } = require("../../config/db");
const RepositoryError = require("../../errors/RepositoryError");

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(new RepositoryError(`Database run error: ${err.message}`, err));
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(new RepositoryError(`Database get error: ${err.message}`, err));
      } else {
        resolve(row);
      }
    });
  });
};

const createUpload = async (uploadData) => {
  const sql = `
    INSERT INTO uploads (
      public_id,
      storage_key,
      asset_type,
      mime_type,
      file_size,
      checksum,
      duration,
      image_width,
      image_height,
      uploaded_by,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `;
  const params = [
    uploadData.publicId,
    uploadData.storageKey,
    uploadData.assetType,
    uploadData.mimeType,
    uploadData.fileSize,
    uploadData.checksum,
    uploadData.duration ?? null,
    uploadData.imageWidth ?? null,
    uploadData.imageHeight ?? null,
    uploadData.uploadedBy,
  ];
  const result = await run(sql, params);
  return getUploadByPublicId(uploadData.publicId);
};

const getUploadByPublicId = async (publicId) => {
  const sql = `
    SELECT id, public_id, storage_key, asset_type, mime_type, file_size, checksum, duration, image_width, image_height, uploaded_by, status, created_at, updated_at
    FROM uploads
    WHERE public_id = ?
    LIMIT 1
  `;
  return get(sql, [publicId]);
};

const getUploadByStorageKey = async (storageKey) => {
  const sql = `
    SELECT id, public_id, storage_key, asset_type, mime_type, file_size, checksum, duration, image_width, image_height, uploaded_by, status, created_at, updated_at
    FROM uploads
    WHERE storage_key = ?
    LIMIT 1
  `;
  return get(sql, [storageKey]);
};

const updateUpload = async (publicId, updateData) => {
  const fields = [];
  const params = [];
  
  if (updateData.storageKey !== undefined) {
    fields.push("storage_key = ?");
    params.push(updateData.storageKey);
  }
  if (updateData.mimeType !== undefined) {
    fields.push("mime_type = ?");
    params.push(updateData.mimeType);
  }
  if (updateData.fileSize !== undefined) {
    fields.push("file_size = ?");
    params.push(updateData.fileSize);
  }
  if (updateData.checksum !== undefined) {
    fields.push("checksum = ?");
    params.push(updateData.checksum);
  }
  if (updateData.duration !== undefined) {
    fields.push("duration = ?");
    params.push(updateData.duration);
  }
  if (updateData.imageWidth !== undefined) {
    fields.push("image_width = ?");
    params.push(updateData.imageWidth);
  }
  if (updateData.imageHeight !== undefined) {
    fields.push("image_height = ?");
    params.push(updateData.imageHeight);
  }
  if (updateData.status !== undefined) {
    fields.push("status = ?");
    params.push(updateData.status);
  }

  if (fields.length === 0) {
    return getUploadByPublicId(publicId);
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  params.push(publicId);

  const sql = `
    UPDATE uploads
    SET ${fields.join(", ")}
    WHERE public_id = ?
  `;

  const result = await run(sql, params);
  if (result.changes === 0) {
    return null;
  }
  return getUploadByPublicId(publicId);
};

const softDeleteUpload = async (publicId) => {
  const sql = `
    UPDATE uploads
    SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
    WHERE public_id = ?
  `;
  const result = await run(sql, [publicId]);
  return result.changes > 0;
};

module.exports = {
  createUpload,
  getUploadByPublicId,
  getUploadByStorageKey,
  updateUpload,
  softDeleteUpload,
};
