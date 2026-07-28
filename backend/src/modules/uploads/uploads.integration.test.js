const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { db } = require("../../config/db");
const jwtUtil = require("../../utils/jwt");
const { storageProvider } = require("../../storage/r2.provider");

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "uploads_integration_test.db");
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "uploads_integration_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "uploads_integration_test_refresh_secret_key";
process.env.R2_ENDPOINT = "https://mock.r2.endpoint.com";
process.env.R2_ACCESS_KEY_ID = "mock_access_key";
process.env.R2_SECRET_ACCESS_KEY = "mock_secret_key";
process.env.R2_BUCKET = "mock-bucket";

// Suppress output
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

const D1DatabaseMock = (new db.constructor()).constructor;
["exec", "close", "serialize", "run", "get", "all"].forEach((method) => {
  D1DatabaseMock.prototype[method] = function (...args) {
    return this.sqliteDb[method](...args);
  };
});

let server;
let port;
let client;
let adminToken;
let customerToken;

const schemaPath = path.join(__dirname, "../../../Database/schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

const startServer = () => {
  return new Promise((resolve) => {
    const app = require("../../app");
    server = http.createServer(app);
    server.listen(0, () => {
      port = server.address().port;
      client = axios.create({
        baseURL: `http://localhost:${port}`,
        validateStatus: () => true
      });
      resolve();
    });
  });
};

const seedData = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.exec(schema, (err) => {
        if (err) return reject(err);

        db.run(
          `INSERT INTO users (id, public_id, email, name, role, status) VALUES 
           (1, 'usr_admin', 'admin@example.com', 'admin_user', 'admin', 'active'),
           (2, 'usr_customer', 'customer@example.com', 'customer_user', 'customer', 'active')`,
          [],
          (err2) => {
            if (err2) reject(err2);
            else resolve();
          }
        );
      });
    });
  });
};

const constructMultipart = (fieldName, filename, fileBuffer, mimeType, otherFields = {}) => {
  const boundary = "----TestBoundary" + Math.random().toString(36).substring(2);
  const parts = [];

  for (const [key, value] of Object.entries(otherFields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
  }

  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  ));
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);
  const headers = {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": body.length
  };

  return { body, headers };
};

beforeAll(async () => {
  adminToken = jwtUtil.generateAccessToken({ sub: 1, role: "admin", sid: "sess_admin" });
  customerToken = jwtUtil.generateAccessToken({ sub: 2, role: "customer", sid: "sess_customer" });

  await seedData();
  await startServer();
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) return reject(err);
      try {
        fs.unlinkSync(testDbPath);
      } catch (e) {}
      resolve();
    });
  });
});

describe("Uploads Integration Tests", () => {
  let uploadPublicId;
  let mockUploadSpy;
  let mockDeleteSpy;

  beforeEach(() => {
    mockUploadSpy = jest.spyOn(storageProvider, "uploadObject").mockResolvedValue({ success: true });
    mockDeleteSpy = jest.spyOn(storageProvider, "deleteObject").mockResolvedValue({ success: true });
    jest.spyOn(storageProvider, "createPublicPreviewUrl").mockResolvedValue("https://fake-cdn.com/preview-link");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/uploads/audio", () => {
    test("Should reject with 401 if unauthorized", async () => {
      const { body, headers } = constructMultipart("audio", "test.wav", Buffer.from("fake wav data"), "audio/wav");
      const res = await client.post("/api/uploads/audio", body, { headers });
      expect(res.status).toBe(401);
    });

    test("Should reject with 403 if user is not admin", async () => {
      const { body, headers } = constructMultipart("audio", "test.wav", Buffer.from("fake wav data"), "audio/wav");
      const res = await client.post("/api/uploads/audio", body, {
        headers: {
          ...headers,
          Authorization: `Bearer ${customerToken}`
        }
      });
      expect(res.status).toBe(403);
    });

    test("Should reject if audio file is missing", async () => {
      const res = await client.post("/api/uploads/audio", null, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      expect(res.status).toBe(400);
      expect(res.data.error.message).toContain("Empty or missing file upload");
    });

    test("Should reject if file format/MIME type is invalid", async () => {
      const { body, headers } = constructMultipart("audio", "test.txt", Buffer.from("fake text file"), "text/plain");
      const res = await client.post("/api/uploads/audio", body, {
        headers: {
          ...headers,
          Authorization: `Bearer ${adminToken}`
        }
      });
      expect(res.status).toBe(400);
      expect(res.data.error.message).toContain("Invalid audio file");
    });

    test("Should reject if file exceeds size limit (25MB)", async () => {
      const largeBuffer = Buffer.alloc(26 * 1024 * 1024);
      const { body, headers } = constructMultipart("audio", "large.wav", largeBuffer, "audio/wav");
      const res = await client.post("/api/uploads/audio", body, {
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        headers: {
          ...headers,
          Authorization: `Bearer ${adminToken}`
        }
      });
      expect(res.status).toBe(400);
      expect(res.data.error.message).toContain("Audio file exceeds maximum 25MB limit");
    });

    test("Should upload beat audio successfully if authenticated as admin", async () => {
      const wavHeader = Buffer.alloc(44);
      wavHeader.write("RIFF", 0);
      wavHeader.writeInt32LE(44100, 28);
      const { body, headers } = constructMultipart("audio", "beat.wav", wavHeader, "audio/wav");
      const res = await client.post("/api/uploads/audio", body, {
        headers: {
          ...headers,
          Authorization: `Bearer ${adminToken}`
        }
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.public_id).toBeDefined();
      expect(res.data.data.asset_type).toBe("audio");
      expect(res.data.data.duration).toBeGreaterThanOrEqual(0);
      expect(mockUploadSpy).toHaveBeenCalled();
      uploadPublicId = res.data.data.public_id;
    });

    test("Should reject audio upload with malicious traversal path filename", async () => {
      const { body, headers } = constructMultipart("audio", "suspicious.wav", Buffer.from("fake wav data"), "audio/wav");
      const res = await client.post("/api/uploads/audio", body, {
        headers: {
          ...headers,
          Authorization: `Bearer ${adminToken}`,
          "X-Original-Filename": "../suspicious.wav"
        }
      });
      expect(res.status).toBe(400);
      expect(res.data.error.message).toContain("Malicious or invalid filename");
    });
  });

  describe("POST /api/uploads/image", () => {
    test("Should upload cover image successfully", async () => {
      const pngBuffer = Buffer.alloc(30);
      pngBuffer.writeUInt32BE(0x89504E47, 0);
      pngBuffer.writeInt32BE(1024, 16);
      pngBuffer.writeInt32BE(768, 20);
      const { body, headers } = constructMultipart("image", "cover.png", pngBuffer, "image/png");
      const res = await client.post("/api/uploads/image", body, {
        headers: {
          ...headers,
          Authorization: `Bearer ${adminToken}`
        }
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.asset_type).toBe("cover");
      expect(res.data.data.image_width).toBe(1024);
      expect(res.data.data.image_height).toBe(768);
    });

    test("Should upload avatar image successfully when type=avatar query is sent", async () => {
      const pngBuffer = Buffer.alloc(30);
      pngBuffer.writeUInt32BE(0x89504E47, 0);
      pngBuffer.writeInt32BE(200, 16);
      pngBuffer.writeInt32BE(200, 20);
      const { body, headers } = constructMultipart("image", "avatar.png", pngBuffer, "image/png");
      const res = await client.post("/api/uploads/image?type=avatar", body, {
        headers: {
          ...headers,
          Authorization: `Bearer ${adminToken}`
        }
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.asset_type).toBe("avatar");
      expect(res.data.data.image_width).toBe(200);
      expect(res.data.data.image_height).toBe(200);
    });
  });

  describe("GET /api/uploads/:publicId", () => {
    test("Should retrieve upload metadata with public Url", async () => {
      const res = await client.get(`/api/uploads/${uploadPublicId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.public_id).toBe(uploadPublicId);
      expect(res.data.data.publicUrl).toBe("https://fake-cdn.com/preview-link");
    });

    test("Should return 404 if upload record is not found", async () => {
      const res = await client.get("/api/uploads/upl_missing", {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/uploads/:publicId", () => {
    test("Should replace existing asset atomically", async () => {
      const newWavHeader = Buffer.alloc(44);
      newWavHeader.write("RIFF", 0);
      newWavHeader.writeInt32LE(44100, 28);
      const { body, headers } = constructMultipart("file", "beat-new.wav", newWavHeader, "audio/wav");
      const res = await client.patch(`/api/uploads/${uploadPublicId}`, body, {
        headers: {
          ...headers,
          Authorization: `Bearer ${adminToken}`
        }
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(mockUploadSpy).toHaveBeenCalled();
      expect(mockDeleteSpy).toHaveBeenCalled();
    });

    test("Should rollback database update / preserve old file if upload fails", async () => {
      mockUploadSpy.mockRejectedValue(new Error("Storage timeout or network failure"));

      const newWavHeader = Buffer.alloc(44);
      newWavHeader.write("RIFF", 0);
      const { body, headers } = constructMultipart("file", "beat-failed.wav", newWavHeader, "audio/wav");
      const res = await client.patch(`/api/uploads/${uploadPublicId}`, body, {
        headers: {
          ...headers,
          Authorization: `Bearer ${adminToken}`
        }
      });

      expect(res.status).toBe(500);
      expect(mockDeleteSpy).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/uploads/:publicId", () => {
    test("Should soft delete metadata and remove storage object", async () => {
      const res = await client.delete(`/api/uploads/${uploadPublicId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(mockDeleteSpy).toHaveBeenCalled();

      const fetchRes = await client.get(`/api/uploads/${uploadPublicId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      expect(fetchRes.status).toBe(404);
    });
  });
});
