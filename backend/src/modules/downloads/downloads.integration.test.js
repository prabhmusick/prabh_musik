/**
 * @fileoverview Integration Tests for Downloads API and Gating
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "downloads_integration_test.db");

// Set environment variables before loading modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "downloads_integration_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "downloads_integration_test_refresh_secret_key";
process.env.R2_ENDPOINT = "https://mock.r2.endpoint.com";
process.env.R2_ACCESS_KEY_ID = "mock_access_key";
process.env.R2_SECRET_ACCESS_KEY = "mock_secret_key";
process.env.R2_BUCKET = "mock-bucket";

// Suppress console output to keep Jest logs clean
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

// Mock AWS S3 client / request presigner to avoid network requests during test runs
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://mock-signed-r2-url.com/beat.mp3?token=mocked")
}));

const app = require("../../app");
const { db } = require("../../config/db");
const jwtUtil = require("../../utils/jwt");

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
let customerAToken;
let customerBToken;

const seedData = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Insert Users
      db.run(
        `INSERT INTO users (id, public_id, email, name, role, status) VALUES 
         (1, 'usr_admin', 'admin@example.com', 'Admin User', 'admin', 'active'),
         (2, 'usr_custA', 'customerA@example.com', 'Customer A', 'customer', 'active'),
         (3, 'usr_custB', 'customerB@example.com', 'Customer B', 'customer', 'active')`,
        [],
        (err) => {
          if (err) return reject(err);

          // 2. Insert Beats
          db.run(
            `INSERT INTO beats (id, public_id, title, slug, price_amount, currency_code, audio_key, status, created_by) VALUES 
             (201, 'bt_201', 'Beat A', 'beat-a', 9900, 'INR', 'audio/201.mp3', 'published', 1)`,
            [],
            (err2) => {
              if (err2) return reject(err2);

              // 3. Insert Orders
              db.run(
                `INSERT INTO orders (id, public_id, customer_id, total_amount, payment_method, status) VALUES 
                 (10, 'ord_10', 2, 9900, 'card', 'paid'),
                 (11, 'ord_11', 2, 9900, 'card', 'paid'),
                 (12, 'ord_12', 2, 9900, 'card', 'paid'),
                 (13, 'ord_13', 2, 9900, 'card', 'paid')`,
                [],
                (err3) => {
                  if (err3) return reject(err3);

                  // 4. Insert Ownerships:
                  // 50: Active, valid, no expiry, unlimited downloads
                  // 51: Expired in the past
                  // 52: Revoked status
                  // 53: Download limit reached (max_downloads = 1, download_count = 1)
                  db.run(
                    `INSERT INTO ownerships (id, public_id, user_id, beat_id, order_id, license_type, purchase_price, download_count, max_downloads, expires_at, status) VALUES 
                     (50, 'own_50', 2, 201, 10, 'exclusive', 9900, 0, NULL, NULL, 'active'),
                     (51, 'own_expired', 2, 201, 11, 'exclusive', 9900, 0, NULL, '2020-01-01 00:00:00', 'active'),
                     (52, 'own_revoked', 2, 201, 12, 'exclusive', 9900, 0, NULL, NULL, 'revoked'),
                     (53, 'own_limit', 2, 201, 13, 'exclusive', 9900, 1, 1, NULL, 'active')`,
                    [],
                    (err4) => {
                      if (err4) reject(err4);
                      else resolve();
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
};

beforeAll(async () => {
  // Initialize Schema on SQLite
  const schemaPath = path.join(__dirname, "..", "..", "..", "Database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await seedData();

  // Generate tokens
  adminToken = jwtUtil.generateAccessToken({ sub: 1, role: "admin", sid: "session_admin" });
  customerAToken = jwtUtil.generateAccessToken({ sub: 2, role: "customer", sid: "session_custA" });
  customerBToken = jwtUtil.generateAccessToken({ sub: 3, role: "customer", sid: "session_custB" });

  // Spin up Express App
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      client = axios.create({
        baseURL: `http://localhost:${port}`,
        validateStatus: () => true
      });
      resolve();
    });
  });
});

afterAll(async () => {
  consoleLogSpy.mockRestore();
  consoleWarnSpy.mockRestore();
  consoleErrorSpy.mockRestore();

  await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) return reject(err);
      try {
        if (fs.existsSync(testDbPath)) {
          fs.unlinkSync(testDbPath);
        }
      } catch (e) {}
      resolve();
    });
  });
});

describe("Downloads Integration Tests", () => {
  describe("GET /api/downloads/:ownershipPublicId", () => {
    test("Should reject with 401 if unauthenticated", async () => {
      const res = await client.get("/api/downloads/own_50");
      expect(res.status).toBe(401);
    });

    test("Should return secure signed URL if authenticated and ownership valid", async () => {
      const res = await client.get("/api/downloads/own_50", {
        headers: { Authorization: `Bearer ${customerAToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.downloadUrl).toContain("mock-signed-r2-url.com");

      // Verify that download log was recorded and count incremented
      const logCheck = await new Promise((resolve) => {
        db.all("SELECT * FROM download_logs WHERE ownership_id = 50", [], (err, rows) => resolve(rows));
      });
      expect(logCheck.length).toBe(1);
      expect(logCheck[0].status).toBe("success");

      const ownCheck = await new Promise((resolve) => {
        db.get("SELECT download_count FROM ownerships WHERE id = 50", [], (err, row) => resolve(row));
      });
      expect(ownCheck.download_count).toBe(1);
    });

    test("Should reject with 403 if ownership has expired", async () => {
      const res = await client.get("/api/downloads/own_expired", {
        headers: { Authorization: `Bearer ${customerAToken}` }
      });
      expect(res.status).toBe(403);
      expect(res.data.error.message).toContain("expired");
    });

    test("Should reject with 404 if ownership is revoked (inactive)", async () => {
      const res = await client.get("/api/downloads/own_revoked", {
        headers: { Authorization: `Bearer ${customerAToken}` }
      });
      expect(res.status).toBe(404);
    });

    test("Should reject with 403 if download count limit is exceeded", async () => {
      const res = await client.get("/api/downloads/own_limit", {
        headers: { Authorization: `Bearer ${customerAToken}` }
      });
      expect(res.status).toBe(403);
      expect(res.data.error.message).toContain("limit exceeded");
    });

    test("Should reject with 403 if user does not own the beat license", async () => {
      const res = await client.get("/api/downloads/own_50", {
        headers: { Authorization: `Bearer ${customerBToken}` }
      });
      expect(res.status).toBe(403);
      expect(res.data.error.message).toContain("do not own this license");
    });
  });

  describe("GET /api/downloads/history", () => {
    test("Should return history for customer user A", async () => {
      const res = await client.get("/api/downloads/history", {
        headers: { Authorization: `Bearer ${customerAToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      expect(res.data.data.length).toBeGreaterThanOrEqual(1);
      expect(res.data.data[0].ownership_public_id).toBe("own_50");
      expect(res.data.data[0].beat_title).toBe("Beat A");
    });

    test("Should return empty list or empty history for customer user B", async () => {
      const res = await client.get("/api/downloads/history", {
        headers: { Authorization: `Bearer ${customerBToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBe(0);
    });
  });

  describe("GET /api/downloads/admin", () => {
    test("Should reject customer with 403", async () => {
      const res = await client.get("/api/downloads/admin", {
        headers: { Authorization: `Bearer ${customerAToken}` }
      });
      expect(res.status).toBe(403);
    });

    test("Should return all download logs for administrators", async () => {
      const res = await client.get("/api/downloads/admin", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBeGreaterThanOrEqual(1);
      expect(res.data.data[0].user_email).toBe("customerA@example.com");
    });
  });

  describe("GET /api/downloads/admin/:ownershipPublicId", () => {
    test("Should reject customer with 403", async () => {
      const res = await client.get("/api/downloads/admin/own_50", {
        headers: { Authorization: `Bearer ${customerAToken}` }
      });
      expect(res.status).toBe(403);
    });

    test("Should return download logs for a specific ownership for administrator", async () => {
      const res = await client.get("/api/downloads/admin/own_50", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBeGreaterThanOrEqual(1);
      expect(res.data.data[0].ownership_public_id).toBe("own_50");
    });
  });
});
