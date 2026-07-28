/**
 * @fileoverview Integration Tests for Monitoring and Observability Domain
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "monitoring_integration_test.db");

// Set environment variables before loading modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "monitoring_integration_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "monitoring_integration_test_refresh_secret_key";
process.env.R2_ENDPOINT = "https://mock.r2.endpoint.com";
process.env.R2_ACCESS_KEY_ID = "mock_access_key";
process.env.R2_SECRET_ACCESS_KEY = "mock_secret_key";
process.env.R2_BUCKET = "mock-bucket";
process.env.STRIPE_SECRET_KEY = "sk_test_monitoring_mock";

// Suppress console output to keep Jest logs clean
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const app = require("../../app");
const { db } = require("../../config/db");
const jwtUtil = require("../../utils/jwt");
const metrics = require("../../utils/metrics");

let server;
let port;
let client;

// Setup test database helpers
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

describe("Monitoring Integration Tests", () => {
  let adminToken;
  let customerToken;
  let adminUserId = 101;
  let customerUserId = 102;

  beforeAll(async () => {
    // 1. Establish SQLite DB tables
    await run(`DROP TABLE IF EXISTS users`);
    await run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        public_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Insert test user and admin
    await run(
      `INSERT INTO users (id, public_id, email, password_hash, role, name, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminUserId, "usr_admin", "admin-monitoring@example.com", "hash", "admin", "Admin User", "active"]
    );
    await run(
      `INSERT INTO users (id, public_id, email, password_hash, role, name, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerUserId, "usr_customer", "customer-monitoring@example.com", "hash", "customer", "Customer User", "active"]
    );

    // 3. Generate tokens
    adminToken = jwtUtil.generateAccessToken({ sub: adminUserId, role: "admin", sid: "sess_admin" });
    customerToken = jwtUtil.generateAccessToken({ sub: customerUserId, role: "customer", sid: "sess_customer" });

    // Mock storage provider connectivity check
    const { storageProvider } = require("../../storage/r2.provider");
    jest.spyOn(storageProvider, "objectExists").mockResolvedValue(true);

    // 4. Fire up HTTP server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;

    client = axios.create({
      baseURL: `http://localhost:${port}`,
      validateStatus: () => true
    });
  });

  afterAll(async () => {
    // Shutdown server
    await new Promise((resolve) => server.close(resolve));
    // Close database before deleting it
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
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("GET /health", () => {
    test("Should return 200 with complete structured dependency details", async () => {
      const res = await client.get("/health");
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.status).toBe("ok");
      expect(res.data.dependencies).toBeDefined();
      expect(res.data.dependencies.database).toBe("connected");
      expect(res.data.dependencies.storage).toBeDefined();
      expect(res.data.dependencies.stripe).toBe("configured");
    });
  });

  describe("GET /ready", () => {
    test("Should return 200 status ready if all configurations are in place", async () => {
      const res = await client.get("/ready");
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.status).toBe("ready");
    });
  });

  describe("Request Correlation (RequestId)", () => {
    test("Should automatically attach X-Request-Id response header", async () => {
      const res = await client.get("/health");
      expect(res.headers["x-request-id"]).toBeDefined();
    });

    test("Should propagate request ID in error JSON responses", async () => {
      const res = await client.get("/invalid-nonexistent-path");
      expect(res.status).toBe(404);
      expect(res.data.requestId).toBeDefined();
    });
  });

  describe("API Monitoring Auth Gate", () => {
    test("Should reject metrics query with 401 if unauthenticated", async () => {
      const res = await client.get("/api/monitoring/metrics");
      expect(res.status).toBe(401);
    });

    test("Should reject metrics query with 403 if authenticated as non-admin", async () => {
      const res = await client.get("/api/monitoring/metrics", {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      expect(res.status).toBe(403);
    });

    test("Should allow metrics and dashboard query if authenticated as admin", async () => {
      const res = await client.get("/api/monitoring/metrics", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.totalRequests).toBeGreaterThan(0);

      const dashboardRes = await client.get("/api/monitoring/dashboard", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(dashboardRes.status).toBe(200);
      expect(dashboardRes.data.success).toBe(true);
    });
  });

  describe("Metrics Telemetry Validation", () => {
    test("Should capture total requests and requests by endpoint", async () => {
      const initialTotal = metrics.metricsState.totalRequests;

      // Make request to endpoint
      await client.get("/health");

      const res = await client.get("/api/monitoring/metrics", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(res.data.data.totalRequests).toBeGreaterThan(initialTotal);
      expect(res.data.data.requestsByEndpoint["GET /health"]).toBeDefined();
    });
  });
});
