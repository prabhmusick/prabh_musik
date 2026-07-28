/**
 * @fileoverview Integration Tests for Authentication Hardened Infrastructure
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "beats_infra_test.db");

// Set up environment config overrides before loading modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "infra_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "infra_test_refresh_secret_key";
process.env.ACCESS_TOKEN_EXPIRY_SECONDS = "900";
process.env.SESSION_EXPIRY_DAYS = "30";

jest.setTimeout(30000);

// Suppress normal console outputs during testing to keep Jest logs clean
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const app = require("../../app");
const { db } = require("../../config/db");
const D1DatabaseMock = (new db.constructor()).constructor;
["exec", "close", "serialize", "run", "get", "all"].forEach((method) => {
  D1DatabaseMock.prototype[method] = function (...args) {
    return this.sqliteDb[method](...args);
  };
});
const audit = require("../../utils/audit");
const cookieUtil = require("../../utils/cookie");
const authService = require("./auth.service");
const ERROR_CODES = require("../../config/errorCodes");

let server;
let port;
let client;

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

  // Mock cookieUtil.setRefreshCookie
  jest.spyOn(cookieUtil, "setRefreshCookie").mockImplementation((res, token) => {
    res.cookie("refreshToken", token, { httpOnly: true });
  });

  // Spin up Server
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      client = axios.create({
        baseURL: `http://localhost:${port}`,
        validateStatus: () => true
      });
      client.interceptors.response.use((response) => {
        if (response.data && response.data.success === false && response.data.error) {
          const { code, message, details } = response.data.error;
          response.data.errorCode = code;
          if (code === "INTERNAL_SERVER_ERROR") {
            response.data.message = "An unexpected error occurred.";
          } else {
            response.data.message = message;
          }
          response.data.details = details !== undefined ? details : null;
          delete response.data.error;
        }
        return response;
      });
      resolve();
    });
  });
});

afterAll(async () => {
  consoleLogSpy.mockRestore();
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

beforeEach(async () => {
  // Reset tables
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("DELETE FROM user_sessions", (err1) => {
        if (err1) return reject(err1);
        db.run("DELETE FROM user_credentials", (err2) => {
          if (err2) return reject(err2);
          db.run("DELETE FROM users", (err3) => {
            if (err3) return reject(err3);
            resolve();
          });
        });
      });
    });
  });
});

describe("Authentication Infrastructure Hardening Tests", () => {
  
  // ==========================================
  // TASK 2 & 5: REQUEST ID & LOGGER CORRELATION
  // ==========================================
  test("✓ Request ID - Should generate unique Request ID, return it in headers, and automatically include it in logs", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    
    const res = await client.post("/api/auth/signup", {
      name: "Jose",
      email: "jose-log@example.com",
      password: "P@ssw0rdStrength!"
    }, {
      headers: { "X-Forwarded-For": "10.0.0.1" }
    });

    expect(res.status).toBe(201);
    
    // 1. Verify Request ID in header
    const requestId = res.headers["x-request-id"];
    expect(requestId).toBeDefined();
    expect(requestId.length).toBeGreaterThan(10);

    // 2. Verify that log calls made during the request lifecycle automatically included this requestId
    expect(consoleSpy).toHaveBeenCalled();
    const loggedObjects = consoleSpy.mock.calls.map(call => call[0]);
    
    // Look for the audit registration emit log
    const registrationLog = loggedObjects.find(log => log && log.event === "USER_REGISTERED");
    expect(registrationLog).toBeDefined();
    expect(registrationLog.requestId).toBe(requestId); // Confirms trace correlation works via AsyncLocalStorage!
    
    consoleSpy.mockRestore();
  });

  test("✓ Request ID - Should reuse X-Request-Id header if supplied by the client", async () => {
    const customId = "client-trace-12345";
    const res = await client.post("/api/auth/signup", {
      name: "Jose",
      email: "jose-reuse@example.com",
      password: "P@ssw0rdStrength!"
    }, {
      headers: { 
        "X-Request-Id": customId,
        "X-Forwarded-For": "10.0.0.2"
      }
    });

    expect(res.headers["x-request-id"]).toBe(customId);
  });

  // ==========================================
  // TASK 3: AUTH RATE LIMITING
  // ==========================================
  test("✓ Rate Limiting - Should return limit headers and block requests exceeding the max limit", async () => {
    // Fire multiple signups. Max limit is configured to 5 in routes.
    // We isolate this test by using a dedicated IP address (10.0.0.9)
    const responses = [];
    for (let i = 0; i < 6; i++) {
      const res = await client.post("/api/auth/signup", {
        name: "Jose",
        email: `rate-${i}@example.com`,
        password: "P@ssw0rdStrength!"
      }, {
        headers: { "X-Forwarded-For": "10.0.0.9" }
      });
      responses.push(res);
    }

    // Inspect headers of request 1
    const firstRes = responses[0];
    expect(firstRes.headers["x-ratelimit-limit"]).toBe("5");
    expect(firstRes.headers["x-ratelimit-remaining"]).toBeDefined();

    // The 6th request must be blocked with 429
    const blockedRes = responses[5];
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers["retry-after"]).toBeDefined();
    expect(blockedRes.data).toEqual({
      success: false,
      message: "Too many registration attempts from this IP, please try again after 15 minutes.",
      errorCode: ERROR_CODES.TOO_MANY_REQUESTS,
      requestId: expect.any(String),
      details: {
        retryAfter: expect.any(Number)
      }
    });
  });

  // ==========================================
  // TASK 1: GLOBAL ERROR STANDARDIZATION
  // ==========================================
  test("✓ Error Standardization - Operational error (validation) should follow the structured shape", async () => {
    const res = await client.post("/api/auth/signup", {
      email: "not-an-email" // triggers 400 validator
    }, {
      headers: { "X-Forwarded-For": "10.0.0.3" }
    });

    expect(res.status).toBe(400);
    expect(res.data).toEqual({
      success: false,
      message: expect.any(String),
      errorCode: ERROR_CODES.INVALID_INPUT,
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ Error Standardization - Operational ConflictError (duplicate) should follow structured shape", async () => {
    // 1. Create first user
    await client.post("/api/auth/signup", {
      name: "Jose",
      email: "jose-dup@example.com",
      password: "P@ssw0rdStrength!"
    }, {
      headers: { "X-Forwarded-For": "10.0.0.4" }
    });

    // 2. Try duplicate email
    const res = await client.post("/api/auth/signup", {
      name: "Jose",
      email: "jose-dup@example.com",
      password: "P@ssw0rdStrength!"
    }, {
      headers: { "X-Forwarded-For": "10.0.0.4" }
    });

    expect(res.status).toBe(409);
    expect(res.data).toEqual({
      success: false,
      message: "Email already in use.",
      errorCode: ERROR_CODES.DUPLICATE_EMAIL,
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ Error Standardization - Non-operational error (500) should redact stack trace and internal message in production", async () => {
    // Temporarily mock environment to production to verify error redaction
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    // Spy on authService.signup and mock it to throw an unexpected database exception
    const signupSpy = jest.spyOn(authService, "signup").mockRejectedValue(new Error("Low-level SQLite read fail: file locked"));

    try {
      const res = await client.post("/api/auth/signup", {
        name: "Jose",
        email: "jose-crash@example.com",
        password: "P@ssw0rdStrength!"
      }, {
        headers: { "X-Forwarded-For": "10.0.0.8" }
      });

      expect(res.status).toBe(500);
      expect(res.data).toEqual({
        success: false,
        message: "An unexpected error occurred.", // Redacted description
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
        requestId: expect.any(String),
        details: null
      });
      expect(res.data).not.toHaveProperty("stack");
    } finally {
      process.env.NODE_ENV = originalEnv;
      signupSpy.mockRestore();
    }
  });

  // ==========================================
  // TASK 4: AUDIT LOG EMISSION
  // ==========================================
  test("✓ Audit Log - Should emit USER_REGISTERED audit log upon successful registration", async () => {
    const auditSpy = jest.spyOn(audit, "emit");

    const res = await client.post("/api/auth/signup", {
      name: "Jose",
      email: "audit-test@example.com",
      password: "P@ssw0rdStrength!"
    }, {
      headers: { "X-Forwarded-For": "10.0.0.5" }
    });

    expect(res.status).toBe(201);

    expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: "USER_REGISTERED",
      userId: expect.any(String),
      metadata: { email: "audit-test@example.com" }
    }));

    auditSpy.mockRestore();
  });
});
