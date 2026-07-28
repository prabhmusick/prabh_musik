const { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const r2 = require("../config/r2");

/**
 * Normalizes file path keys (decodes URI component representation).
 */
const cleanKey = (key) => {
  return typeof key === "string" ? decodeURIComponent(key) : key;
};

class StorageProvider {
  async uploadObject(key, buffer, mimeType) {
    throw new Error("uploadObject() must be implemented.");
  }
  async deleteObject(key) {
    throw new Error("deleteObject() must be implemented.");
  }
  async replaceObject(oldKey, newKey, buffer, mimeType) {
    throw new Error("replaceObject() must be implemented.");
  }
  async objectExists(key) {
    throw new Error("objectExists() must be implemented.");
  }
  async getObjectMetadata(key) {
    throw new Error("getObjectMetadata() must be implemented.");
  }
  async createPublicPreviewUrl(key) {
    throw new Error("createPublicPreviewUrl() must be implemented.");
  }
  async getDownloadStream(key) {
    throw new Error("getDownloadStream() must be implemented.");
  }
  async generatePresignedDownloadUrl(key, expiresInSeconds) {
    throw new Error("generatePresignedDownloadUrl() must be implemented.");
  }
  async getFile(key) {
    throw new Error("getFile() must be implemented.");
  }
  async listFiles(options) {
    throw new Error("listFiles() must be implemented.");
  }
}

class CloudflareR2Provider extends StorageProvider {
  async uploadObject(key, buffer, mimeType) {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: cleanKey(key),
      Body: buffer,
      ContentType: mimeType
    });
    return r2.send(command);
  }

  async deleteObject(key) {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: cleanKey(key)
    });
    return r2.send(command);
  }

  async replaceObject(oldKey, newKey, buffer, mimeType) {
    // Atomic safety check: upload new first, verify success, then delete old
    await this.uploadObject(newKey, buffer, mimeType);
    await this.deleteObject(oldKey);
  }

  async objectExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: cleanKey(key)
      });
      await r2.send(command);
      return true;
    } catch (err) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }

  async getObjectMetadata(key) {
    const command = new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: cleanKey(key)
    });
    const res = await r2.send(command);
    return {
      contentType: res.ContentType,
      contentLength: res.ContentLength,
      eTag: res.ETag,
      lastModified: res.LastModified
    };
  }

  async createPublicPreviewUrl(key) {
    if (process.env.R2_PUBLIC_URL) {
      return `${process.env.R2_PUBLIC_URL}/${cleanKey(key)}`;
    }
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: cleanKey(key)
    });
    // Fallback: 24h presigned URL
    return getSignedUrl(r2, command, { expiresIn: 86400 });
  }

  async getDownloadStream(key) {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: cleanKey(key)
    });
    const response = await r2.send(command);
    return {
      stream: response.Body,
      mimeType: response.ContentType || "audio/mpeg"
    };
  }

  async generatePresignedDownloadUrl(key, expiresInSeconds = 300) {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: cleanKey(key)
    });
    return getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
  }

  async getFile(key) {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: cleanKey(key)
    });
    const response = await r2.send(command);

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
  }

  async listFiles(options = {}) {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
      MaxKeys: options.maxKeys ? parseInt(options.maxKeys, 10) : 1000,
      ContinuationToken: options.continuationToken || undefined,
      Prefix: options.prefix ? cleanKey(options.prefix) : undefined
    });
    return r2.send(command);
  }

  // Backwards compatible aliases mapping file API calls
  async uploadFile(buffer, key, mimetype) {
    return this.uploadObject(key, buffer, mimetype);
  }
  async deleteFile(key) {
    return this.deleteObject(key);
  }
}

const providerInstance = new CloudflareR2Provider();

module.exports = {
  StorageProvider,
  CloudflareR2Provider,
  storageProvider: providerInstance
};
