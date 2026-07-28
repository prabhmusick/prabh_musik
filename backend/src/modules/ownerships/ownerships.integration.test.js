/**
 * @fileoverview Integration Tests for Ownerships API and Gating
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "ownerships_integration_test.db");

// Set environment variables before loading modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "ownerships_integration_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "ownerships_integration_test_refresh_secret_key";

// Suppress console output to keep Jest logs clean
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const app = require("../../app");
const { db } = require("../../config/db");
const D1DatabaseMock = (new db.constructor()).constructor;
["exec", "close", "serialize", "run", "get", "all"].forEach((method) => {
  D1DatabaseMock.prototype[method] = function (...args) {
    return this.sqliteDb[method](...args);
  };
});

const jwtUtil = require("../../utils/jwt");
const ownershipsService = require("./ownerships.service");
const ownershipsRepository = require("./ownerships.repository");

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
             (201, 'bt_201', 'Beat A', 'beat-a', 9900, 'INR', 'audio/201.mp3', 'published', 1),
             (202, 'bt_202', 'Beat B', 'beat-b', 14900, 'INR', 'audio/202.mp3', 'published', 1)`,
            [],
            (err2) => {
              if (err2) return reject(err2);

              // 3. Insert Order
              db.run(
                `INSERT INTO orders (id, public_id, customer_id, total_amount, payment_method, status) VALUES 
                 (10, 'ord_10', 2, 9900, 'card', 'paid')`,
                [],
                (err3) => {
                  if (err3) return reject(err3);

                  // 4. Insert Ownership
                  db.run(
                    `INSERT INTO ownerships (id, public_id, user_id, beat_id, order_id, license_type, purchase_price, status) VALUES 
                     (50, 'own_50', 2, 201, 10, 'exclusive', 9900, 'active')`,
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

describe("Ownerships Integration Tests", () => {
  describe("GET /api/ownerships (Customer Licensed Library)", () => {
    test("Should reject with 401 if unauthenticated", async () => {
      const res = await client.get("/api/ownerships");
      expect(res.status).toBe(401);
    });

    test("Should return customer's owned library when authenticated", async () => {
      const res = await client.get("/api/ownerships", {
        headers: { Authorization: `Bearer ${customerAToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      expect(res.data.data.length).toBe(1);
      expect(res.data.data[0].ownershipId).toBe(50);
      expect(res.data.data[0].beat.title).toBe("Beat A");
    });
  });

  describe("GET /api/ownerships/:publicId", () => {
    test("Should permit customer A to view their own license record", async () => {
      const res = await client.get("/api/ownerships/own_50", {
        headers: { Authorization: `Bearer ${customerAToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.public_id).toBe("own_50");
    });

    test("Should permit admin to view customer A's license record", async () => {
      const res = await client.get("/api/ownerships/own_50", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    test("Should reject customer B with 403 trying to view customer A's license record", async () => {
      const res = await client.get("/api/ownerships/own_50", {
        headers: { Authorization: `Bearer ${customerBToken}` }
      });
      expect(res.status).toBe(403);
      expect(res.data.success).toBe(false);
    });
  });

  describe("GET /api/ownerships/admin", () => {
    test("Should reject customer A with 403 Forbidden", async () => {
      const res = await client.get("/api/ownerships/admin", {
        headers: { Authorization: `Bearer ${customerAToken}` }
      });
      expect(res.status).toBe(403);
    });

    test("Should return all active ownership records for Admin user", async () => {
      const res = await client.get("/api/ownerships/admin", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.length).toBe(1);
    });
  });

  describe("PATCH /api/ownerships/:publicId & DELETE /api/ownerships/:publicId (Admin Actions)", () => {
    test("Should permit admin to update expiry date on ownership record", async () => {
      const expiresAt = new Date(Date.now() + 86400000).toISOString();
      const res = await client.patch(
        "/api/ownerships/own_50",
        { expiresAt },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.expires_at).toBe(expiresAt);
    });

    test("Should permit admin to revoke ownership record", async () => {
      const res = await client.delete("/api/ownerships/own_50", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.status).toBe("revoked");
    });
  });

  describe("POST /api/ownerships/:publicId/download", () => {
    test("Should increment download count for active ownership", async () => {
      // Re-activate ownership 50 in DB since it was soft-revoked in the previous test
      await new Promise((resolve) => {
        db.run("UPDATE ownerships SET status = 'active', download_count = 0 WHERE id = 50", [], () => resolve());
      });

      const res = await client.post(
        "/api/ownerships/own_50/download",
        {},
        { headers: { Authorization: `Bearer ${customerAToken}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.downloadCount).toBe(1);
    });
  });

  describe("Fulfillment Integration & Duplicate Prevention", () => {
    test("Should throw duplicate ownership record error if calling createOwnershipsFromOrder twice", async () => {
      const mockOrder = {
        id: 10,
        customer: { id: 2 },
        items: [{ beatId: 202, price: 14900, licenseType: "exclusive" }]
      };

      // Create first time via service
      const results = await ownershipsService.createOwnershipsFromOrder(mockOrder);
      expect(results.length).toBe(1);
      expect(results[0].beat_id).toBe(202);

      // Create second time should fail with 409 Conflict
      await expect(
        ownershipsService.createOwnershipsFromOrder(mockOrder)
      ).rejects.toThrow();
    });
  });
});
