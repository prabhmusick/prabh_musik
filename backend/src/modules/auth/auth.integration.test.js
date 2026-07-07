/**
 * @fileoverview End-to-End Integration Tests for POST /api/auth/signup
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "beats_integration_test.db");

// Set env variables and database overrides before loading modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "integration_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "integration_test_refresh_secret_key";
process.env.ACCESS_TOKEN_EXPIRY_SECONDS = "900";
process.env.SESSION_EXPIRY_DAYS = "30";

// Suppress console output to keep Jest logs clean
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const app = require("../../app");
const { db } = require("../../config/db");
const cookieUtil = require("../../utils/cookie");

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

  // Mock cookieUtil.setRefreshCookie to write real cookies on the response so we can inspect headers
  jest.spyOn(cookieUtil, "setRefreshCookie").mockImplementation((res, token) => {
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/auth"
    });
  });

  // Spin up Express App
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      client = axios.create({
        baseURL: `http://localhost:${port}`,
        validateStatus: () => true // Allow asserting non-2xx status codes directly
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

describe("POST /api/auth/signup - E2E Integration & Validation", () => {
  const validPayload = {
    name: "José O'Connor",
    email: "jose@example.com",
    password: "P@ssw0rdStrength!"
  };

  test("✓ Happy Path - Should successfully sign up, write to SQLite, return 201, and issue secure HttpOnly cookie", async () => {
    const res = await client.post("/api/auth/signup", validPayload, {
      headers: {
        "User-Agent": "E2E-Test-Agent",
        "X-Forwarded-For": "203.0.113.195, 70.42.1.1"
      }
    });

    expect(res.status).toBe(201);
    expect(res.data).toEqual({
      success: true,
      message: "Account created successfully.",
      data: {
        user: {
          public_id: expect.any(String),
          name: "José O'Connor",
          email: "jose@example.com",
          role: "customer",
          status: "active"
        },
        accessToken: expect.any(String),
        expiresIn: 900
      }
    });

    // Verify Set-Cookie header contains HttpOnly, Secure, SameSite, and Path
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies[0];
    expect(refreshCookie).toContain("refreshToken=");
    expect(refreshCookie).toContain("HttpOnly");
    expect(refreshCookie).toContain("Secure");
    expect(refreshCookie).toContain("SameSite=Lax");
    expect(refreshCookie).toContain("Path=/api/auth");

    // Verify Database write
    const users = await new Promise((resolve) => {
      db.all("SELECT * FROM users WHERE email = ?", ["jose@example.com"], (err, rows) => {
        resolve(rows);
      });
    });
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("José O'Connor");

    // Verify credential write (password hashed)
    const credentials = await new Promise((resolve) => {
      db.all("SELECT * FROM user_credentials WHERE user_id = ?", [users[0].id], (err, rows) => {
        resolve(rows);
      });
    });
    expect(credentials.length).toBe(1);
    expect(credentials[0].password_hash).not.toBeNull();
    expect(credentials[0].password_hash).not.toBe("P@ssw0rdStrength!"); // Confirms password hashed

    // Verify session write (ip extracted from proxy chain, refresh token hashed)
    const sessions = await new Promise((resolve) => {
      db.all("SELECT * FROM user_sessions WHERE user_id = ?", [users[0].id], (err, rows) => {
        resolve(rows);
      });
    });
    expect(sessions.length).toBe(1);
    expect(sessions[0].ip).toBe("203.0.113.195");
    expect(sessions[0].user_agent).toBe("E2E-Test-Agent");
    expect(sessions[0].refresh_token_hash).not.toBeNull();
  });

  test("✓ Validation - Missing name parameter should return 400 Bad Request", async () => {
    const res = await client.post("/api/auth/signup", {
      email: "jose@example.com",
      password: "P@ssw0rdStrength!"
    });
    expect(res.status).toBe(400);
    expect(res.data).toEqual({
      success: false,
      message: expect.stringContaining("Name is required"),
      errorCode: "INVALID_INPUT",
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ Validation - Invalid email format should return 400 Bad Request", async () => {
    const res = await client.post("/api/auth/signup", {
      name: "José",
      email: "not-an-email",
      password: "P@ssw0rdStrength!"
    });
    expect(res.status).toBe(400);
    expect(res.data).toEqual({
      success: false,
      message: expect.stringContaining("Invalid email"),
      errorCode: "INVALID_INPUT",
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ Validation - Weak password strength should return 400 Bad Request", async () => {
    const res = await client.post("/api/auth/signup", {
      name: "José",
      email: "jose@example.com",
      password: "weak"
    });
    expect(res.status).toBe(400);
    expect(res.data).toEqual({
      success: false,
      message: expect.stringContaining("Password must be at least 8 characters"),
      errorCode: "WEAK_PASSWORD",
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ Business Rules - Registering with a duplicate email should return 409 Conflict", async () => {
    // Register first user
    const res1 = await client.post("/api/auth/signup", validPayload);
    expect(res1.status).toBe(201);

    // Register second user with same email
    const res2 = await client.post("/api/auth/signup", {
      name: "Another Name",
      email: "jose@example.com",
      password: "AnotherPassword123!"
    });

    expect(res2.status).toBe(409);
    expect(res2.data).toEqual({
      success: false,
      message: "Email already in use.",
      errorCode: "DUPLICATE_EMAIL",
      requestId: expect.any(String),
      details: null
    });
  });
});

describe("POST /api/auth/login - E2E Integration & Validation", () => {
  const loginPayload = {
    email: "login-test@example.com",
    password: "P@ssw0rdStrength!"
  };

  let testUserId;

  beforeEach(async () => {
    // Seed user directly into SQLite to bypass signup rate limits and speed up runs
    const bcrypt = require("bcrypt");
    const crypto = require("crypto");
    const passwordHash = await bcrypt.hash(loginPayload.password, 4); // Fast work factor for testing
    const publicId = crypto.randomUUID();

    testUserId = await new Promise((resolve, reject) => {
      db.run("INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        [publicId, "Login Test User", loginPayload.email, "customer", "active"],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    await new Promise((resolve, reject) => {
      db.run("INSERT INTO user_credentials (user_id, provider, password_hash) VALUES (?, ?, ?)",
        [testUserId, "email", passwordHash],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  test("✓ Successful login - Should return 200, update last_login_at, and issue refresh cookie", async () => {
    // Find initial user row to check last_login_at is null
    const initialUser = await new Promise((resolve) => {
      db.get("SELECT * FROM users WHERE email = ?", [loginPayload.email], (err, row) => resolve(row));
    });
    expect(initialUser.last_login_at).toBeNull();

    const res = await client.post("/api/auth/login", loginPayload, {
      headers: {
        "User-Agent": "Login-Agent",
        "X-Forwarded-For": "203.0.113.195"
      }
    });

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      success: true,
      message: "Logged in successfully.",
      data: {
        user: {
          public_id: initialUser.public_id,
          name: "Login Test User",
          email: "login-test@example.com",
          role: "customer",
          status: "active"
        },
        accessToken: expect.any(String),
        expiresIn: 900
      }
    });

    // Check Set-Cookie headers
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("refreshToken=");

    // Verify last_login_at was updated in DB
    const updatedUser = await new Promise((resolve) => {
      db.get("SELECT * FROM users WHERE email = ?", [loginPayload.email], (err, row) => resolve(row));
    });
    expect(updatedUser.last_login_at).not.toBeNull();

    // Verify user_sessions table has a record
    const sessions = await new Promise((resolve) => {
      db.all("SELECT * FROM user_sessions WHERE user_id = ?", [initialUser.id], (err, rows) => resolve(rows));
    });
    expect(sessions.length).toBe(1); // 1 from login
  });

  test("✓ Wrong password - Should return 401 INVALID_CREDENTIALS", async () => {
    const res = await client.post("/api/auth/login", {
      email: loginPayload.email,
      password: "wrong-password"
    });

    expect(res.status).toBe(401);
    expect(res.data).toEqual({
      success: false,
      message: "Invalid email or password.",
      errorCode: "INVALID_CREDENTIALS",
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ Wrong email - Should return 401 INVALID_CREDENTIALS", async () => {
    const res = await client.post("/api/auth/login", {
      email: "unregistered@example.com",
      password: loginPayload.password
    });

    expect(res.status).toBe(401);
    expect(res.data).toEqual({
      success: false,
      message: "Invalid email or password.",
      errorCode: "INVALID_CREDENTIALS",
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ OAuth account using password - Should return 401 INVALID_CREDENTIALS", async () => {
    // Create OAuth user without password credentials record
    const publicId = require("crypto").randomUUID();
    const userId = await new Promise((resolve, reject) => {
      db.run("INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)", 
        [publicId, "OAuth User", "oauth@example.com", "customer", "active"],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Insert google credential row (which has no password_hash)
    await new Promise((resolve, reject) => {
      db.run("INSERT INTO user_credentials (user_id, provider, provider_id) VALUES (?, ?, ?)",
        [userId, "google", "google-oauth-id-123"],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const res = await client.post("/api/auth/login", {
      email: "oauth@example.com",
      password: "Password123!"
    });

    expect(res.status).toBe(401);
    expect(res.data).toEqual({
      success: false,
      message: "Invalid email or password.",
      errorCode: "INVALID_CREDENTIALS",
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ Suspended user - Should return 401 USER_SUSPENDED", async () => {
    // Suspended the user directly in database
    await new Promise((resolve, reject) => {
      db.run("UPDATE users SET status = ? WHERE email = ?", ["suspended", loginPayload.email], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const res = await client.post("/api/auth/login", loginPayload);

    expect(res.status).toBe(401);
    expect(res.data).toEqual({
      success: false,
      message: "User account is suspended.",
      errorCode: "USER_SUSPENDED",
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ Deleted user - Should return 401 INVALID_CREDENTIALS (mitigate leaking deleted state)", async () => {
    // Set user status to deleted directly in database
    await new Promise((resolve, reject) => {
      db.run("UPDATE users SET status = ? WHERE email = ?", ["deleted", loginPayload.email], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const res = await client.post("/api/auth/login", loginPayload);

    expect(res.status).toBe(401);
    expect(res.data).toEqual({
      success: false,
      message: "Invalid email or password.",
      errorCode: "INVALID_CREDENTIALS",
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ Session creation & Multiple concurrent sessions - Should allow repeated logins creating new sessions", async () => {
    // Perform 3 consecutive logins
    const headers = { "User-Agent": "Session-Test", "X-Forwarded-For": "203.0.113.199" };
    const res1 = await client.post("/api/auth/login", loginPayload, { headers });
    const res2 = await client.post("/api/auth/login", loginPayload, { headers });
    const res3 = await client.post("/api/auth/login", loginPayload, { headers });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    const userRow = await new Promise((resolve) => {
      db.get("SELECT id FROM users WHERE email = ?", [loginPayload.email], (err, row) => resolve(row));
    });

    // Check count of sessions in user_sessions table
    const sessions = await new Promise((resolve) => {
      db.all("SELECT * FROM user_sessions WHERE user_id = ?", [userRow.id], (err, rows) => resolve(rows));
    });

    // 3 from the successful logins = 3 total sessions
    expect(sessions.length).toBe(3);
  });

  test("✓ JWT failure - Should map to 500 error gracefully", async () => {
    const jwtUtil = require("../../utils/jwt");
    const jwtSpy = jest.spyOn(jwtUtil, "generateAccessToken").mockImplementation(() => {
      throw new Error("JWT Signing Failed Mock Exception");
    });

    try {
      const res = await client.post("/api/auth/login", loginPayload, {
        headers: { "X-Forwarded-For": "10.0.0.71" }
      });

      expect(res.status).toBe(500);
      expect(res.data).toEqual(expect.objectContaining({
        success: false,
        message: "An unexpected error occurred.",
        errorCode: "INTERNAL_SERVER_ERROR",
        requestId: expect.any(String),
        details: null
      }));
    } finally {
      jwtSpy.mockRestore();
    }
  });

  test("✓ Cookie failure - Should map to 500 error gracefully", async () => {
    cookieUtil.setRefreshCookie.mockImplementation(() => {
      throw new Error("Cookie Write Exception Mock");
    });

    try {
      const res = await client.post("/api/auth/login", loginPayload, {
        headers: { "X-Forwarded-For": "10.0.0.72" }
      });

      expect(res.status).toBe(500);
      expect(res.data).toEqual(expect.objectContaining({
        success: false,
        message: "An unexpected error occurred.",
        errorCode: "INTERNAL_SERVER_ERROR",
        requestId: expect.any(String),
        details: null
      }));
    } finally {
      // Revert to default successful mock implementation for other tests
      cookieUtil.setRefreshCookie.mockImplementation((res, token) => {
        res.cookie("refreshToken", token, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/api/auth"
        });
      });
    }
  });

  test("✓ Rate limiting - Should block login requests after 10 failed attempts", async () => {
    const targetIp = "10.0.0.88";
    const headers = { "X-Forwarded-For": targetIp };

    // Send 10 requests which should hit rate limit on 11th
    for (let i = 0; i < 10; i++) {
      const res = await client.post("/api/auth/login", loginPayload, { headers });
      expect(res.status).toBe(200);
    }

    // 11th request should be blocked
    const resBlocked = await client.post("/api/auth/login", loginPayload, { headers });
    expect(resBlocked.status).toBe(429);
    expect(resBlocked.data).toEqual({
      success: false,
      message: "Too many login attempts from this IP, please try again after 15 minutes.",
      errorCode: "TOO_MANY_REQUESTS",
      requestId: expect.any(String),
      details: {
        retryAfter: expect.any(Number)
      }
    });
  });
});

describe("POST /api/auth/refresh - Rotating Refresh Tokens & Session Lifecycle", () => {
  const loginPayload = {
    email: "refresh-test@example.com",
    password: "P@ssw0rdStrength!"
  };

  let testUserId;
  let testUserPublicId;
  let headers;

  beforeEach(async () => {
    // Generate a unique IP for this test to bypass global rate limiting limits
    const randomIp = `192.168.100.${Math.floor(Math.random() * 254) + 1}`;
    headers = { "X-Forwarded-For": randomIp };

    // Seed user directly into SQLite to bypass signup rate limits and speed up runs
    const bcrypt = require("bcrypt");
    const crypto = require("crypto");
    const passwordHash = await bcrypt.hash(loginPayload.password, 4); // Fast work factor for testing
    const publicId = crypto.randomUUID();
    testUserPublicId = publicId;

    testUserId = await new Promise((resolve, reject) => {
      db.run("INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        [publicId, "Refresh Test User", loginPayload.email, "customer", "active"],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    await new Promise((resolve, reject) => {
      db.run("INSERT INTO user_credentials (user_id, provider, password_hash) VALUES (?, ?, ?)",
        [testUserId, "email", passwordHash],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  test("✓ Successful refresh - Should return 200, rotate refresh cookie, and return new access token", async () => {
    // 1. Log in to get initial refresh token cookie
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    expect(loginRes.status).toBe(200);

    const initialCookies = loginRes.headers["set-cookie"];
    expect(initialCookies).toBeDefined();
    const initialCookie = initialCookies[0].split(";")[0]; // "refreshToken=..."

    // 2. Perform refresh
    const refreshRes = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.data).toEqual({
      success: true,
      message: "Token refreshed successfully.",
      data: {
        user: {
          public_id: testUserPublicId,
          name: "Refresh Test User",
          email: loginPayload.email,
          role: "customer",
          status: "active"
        },
        accessToken: expect.any(String),
        expiresIn: 900
      }
    });

    // 3. Verify new refresh token cookie was set
    const rotatedCookies = refreshRes.headers["set-cookie"];
    expect(rotatedCookies).toBeDefined();
    expect(rotatedCookies[0]).toContain("refreshToken=");
    expect(rotatedCookies[0]).not.toBe(initialCookies[0]);
  });

  test("✓ Missing cookie - Should return 401 INVALID_SESSION", async () => {
    const res = await client.post("/api/auth/refresh", {}, { headers });
    expect(res.status).toBe(401);
    expect(res.data).toEqual({
      success: false,
      message: "Invalid or expired session.",
      errorCode: "INVALID_SESSION",
      requestId: expect.any(String),
      details: null
    });
  });

  test("✓ Invalid signature - Should return 401 INVALID_SESSION", async () => {
    const jwt = require("jsonwebtoken");
    const invalidToken = jwt.sign({ sub: testUserPublicId, sid: "session-uuid" }, "wrong_secret");
    
    const res = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: `refreshToken=${invalidToken}` }
    });

    expect(res.status).toBe(401);
    expect(res.data.errorCode).toBe("INVALID_SESSION");
  });

  test("✓ Expired refresh - Should return 401 INVALID_SESSION", async () => {
    const jwt = require("jsonwebtoken");
    const expiredToken = jwt.sign(
      { sub: testUserPublicId, sid: "session-uuid", exp: Math.floor(Date.now() / 1000) - 3600 },
      process.env.JWT_REFRESH_SECRET
    );

    const res = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: `refreshToken=${expiredToken}` }
    });

    expect(res.status).toBe(401);
    expect(res.data.errorCode).toBe("INVALID_SESSION");
  });

  test("✓ Hash mismatch - Should return 401 INVALID_SESSION and revoke session", async () => {
    // 1. Login to establish session
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const initialCookie = loginRes.headers["set-cookie"][0].split(";")[0];
    const jwt = require("jsonwebtoken");
    const tokenVal = initialCookie.split("=")[1];
    const decoded = jwt.decode(tokenVal);

    // 2. Corrupt hash in database directly
    await new Promise((resolve, reject) => {
      db.run("UPDATE user_sessions SET refresh_token_hash = ? WHERE id = ?", ["corrupt_hash_value", decoded.sid], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 3. Call refresh
    const res = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });

    expect(res.status).toBe(401);
    expect(res.data.errorCode).toBe("INVALID_SESSION");

    // 4. Verify session is now revoked
    const sessionRow = await new Promise((resolve) => {
      db.get("SELECT revoked_at FROM user_sessions WHERE id = ?", [decoded.sid], (err, row) => resolve(row));
    });
    expect(sessionRow.revoked_at).not.toBeNull();
  });

  test("✓ Revoked session - Should return 401 INVALID_SESSION", async () => {
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const initialCookie = loginRes.headers["set-cookie"][0].split(";")[0];
    const tokenVal = initialCookie.split("=")[1];
    const decoded = require("jsonwebtoken").decode(tokenVal);

    // Revoke session in DB
    await new Promise((resolve) => {
      db.run("UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?", [decoded.sid], () => resolve());
    });

    const res = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });
    expect(res.status).toBe(401);
    expect(res.data.errorCode).toBe("INVALID_SESSION");
  });

  test("✓ Deleted session - Should return 401 INVALID_SESSION", async () => {
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const initialCookie = loginRes.headers["set-cookie"][0].split(";")[0];
    const tokenVal = initialCookie.split("=")[1];
    const decoded = require("jsonwebtoken").decode(tokenVal);

    // Delete session from DB
    await new Promise((resolve) => {
      db.run("DELETE FROM user_sessions WHERE id = ?", [decoded.sid], () => resolve());
    });

    const res = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });
    expect(res.status).toBe(401);
    expect(res.data.errorCode).toBe("INVALID_SESSION");
  });

  test("✓ Concurrent refresh - Multiple active sessions do not interfere", async () => {
    // 1. Two separate logins (different UA / IP)
    const headers1 = { "X-Forwarded-For": "203.0.113.1" };
    const headers2 = { "X-Forwarded-For": "203.0.113.2" };
    const loginRes1 = await client.post("/api/auth/login", loginPayload, {
      headers: { ...headers1, "User-Agent": "Device-1" }
    });
    const loginRes2 = await client.post("/api/auth/login", loginPayload, {
      headers: { ...headers2, "User-Agent": "Device-2" }
    });

    const cookie1 = loginRes1.headers["set-cookie"][0].split(";")[0];
    const cookie2 = loginRes2.headers["set-cookie"][0].split(";")[0];

    // Refresh device 1
    const refRes1 = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers1, Cookie: cookie1 }
    });
    expect(refRes1.status).toBe(200);

    // Refresh device 2 should still succeed
    const refRes2 = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers2, Cookie: cookie2 }
    });
    expect(refRes2.status).toBe(200);
  });

  test("✓ Rotated token replay attack - Reusing an old token revokes the entire session", async () => {
    // 1. Login to get token A
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const cookieA = loginRes.headers["set-cookie"][0].split(";")[0];
    const tokenA = cookieA.split("=")[1];
    const decoded = require("jsonwebtoken").decode(tokenA);

    // 2. Refresh using token A -> get token B
    const refRes1 = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: cookieA }
    });
    expect(refRes1.status).toBe(200);
    const cookieB = refRes1.headers["set-cookie"][0].split(";")[0];

    // 3. Replay token A (mismatch now since active token is B)
    const replayRes = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: cookieA }
    });
    expect(replayRes.status).toBe(401);
    expect(replayRes.data.errorCode).toBe("INVALID_SESSION");

    // 4. Verify session is revoked
    const sessionRow = await new Promise((resolve) => {
      db.get("SELECT revoked_at FROM user_sessions WHERE id = ?", [decoded.sid], (err, row) => resolve(row));
    });
    expect(sessionRow.revoked_at).not.toBeNull();

    // 5. Token B must now also be blocked
    const refRes2 = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: cookieB }
    });
    expect(refRes2.status).toBe(401);
  });

  test("✓ Refresh A → Refresh B → Refresh C", async () => {
    // Login to get token A
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const cookieA = loginRes.headers["set-cookie"][0].split(";")[0];

    // A -> B
    const refRes1 = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: cookieA }
    });
    expect(refRes1.status).toBe(200);
    const cookieB = refRes1.headers["set-cookie"][0].split(";")[0];

    // B -> C
    const refRes2 = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: cookieB }
    });
    expect(refRes2.status).toBe(200);
    const cookieC = refRes2.headers["set-cookie"][0].split(";")[0];

    // C -> D
    const refRes3 = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: cookieC }
    });
    expect(refRes3.status).toBe(200);
  });

  test("✓ Replay Refresh A after rotation fails", async () => {
    // Login to get token A
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const cookieA = loginRes.headers["set-cookie"][0].split(";")[0];
    const tokenA = cookieA.split("=")[1];
    const decoded = require("jsonwebtoken").decode(tokenA);

    // Mock rotation db write to fail, causing rotation to fail
    const authRepo = require("./auth.repository");
    const rotateSpy = jest.spyOn(authRepo, "rotateSessionToken").mockRejectedValue(new Error("Disk error"));

    try {
      const refRes = await client.post("/api/auth/refresh", {}, {
        headers: { ...headers, Cookie: cookieA }
      });
      expect(refRes.status).toBe(500); // Fails with internal error
    } finally {
      rotateSpy.mockRestore();
    }

    // Since rotation failed, token A is still the active token!
    // So replaying token A now should succeed because it was never rotated!
    const replayRes = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: cookieA }
    });
    expect(replayRes.status).toBe(200);
  });
});

describe("POST /api/auth/logout - Logout Session", () => {
  const loginPayload = {
    email: "logout-test@example.com",
    password: "P@ssw0rdStrength!"
  };

  let testUserId;
  let testUserPublicId;
  let headers;

  beforeEach(async () => {
    const randomIp = `192.168.100.${Math.floor(Math.random() * 254) + 1}`;
    headers = { "X-Forwarded-For": randomIp };

    const bcrypt = require("bcrypt");
    const crypto = require("crypto");
    const passwordHash = await bcrypt.hash(loginPayload.password, 4);
    const publicId = crypto.randomUUID();
    testUserPublicId = publicId;

    testUserId = await new Promise((resolve, reject) => {
      db.run("INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        [publicId, "Logout Test User", loginPayload.email, "customer", "active"],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    await new Promise((resolve, reject) => {
      db.run("INSERT INTO user_credentials (user_id, provider, password_hash) VALUES (?, ?, ?)",
        [testUserId, "email", passwordHash],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  test("✓ Successful logout - Should revoke session, clear cookie, and return 200", async () => {
    // 1. Login to establish session
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    expect(loginRes.status).toBe(200);

    const initialCookie = loginRes.headers["set-cookie"][0].split(";")[0];
    const tokenVal = initialCookie.split("=")[1];
    const decoded = require("jsonwebtoken").decode(tokenVal);

    // 2. Perform logout
    const logoutRes = await client.post("/api/auth/logout", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.data).toEqual({
      success: true,
      message: "Logged out successfully."
    });

    // Verify cookie cleared (Max-Age=0 or Expires in past)
    const clearedCookies = logoutRes.headers["set-cookie"];
    expect(clearedCookies).toBeDefined();
    expect(clearedCookies[0]).toContain("refreshToken=");
    expect(clearedCookies[0]).toContain("Expires=Thu, 01 Jan 1970");

    // Verify revoked_at and revoked_reason are set in database
    const sessionRow = await new Promise((resolve) => {
      db.get("SELECT revoked_at, revoked_reason FROM user_sessions WHERE id = ?", [decoded.sid], (err, row) => resolve(row));
    });
    expect(sessionRow.revoked_at).not.toBeNull();
    expect(sessionRow.revoked_reason).toBe("USER_LOGOUT");
  });

  test("✓ Already revoked - Should remain idempotent and return 200", async () => {
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const initialCookie = loginRes.headers["set-cookie"][0].split(";")[0];
    const tokenVal = initialCookie.split("=")[1];
    const decoded = require("jsonwebtoken").decode(tokenVal);

    // Revoke manually first
    await new Promise((resolve) => {
      db.run("UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?", [decoded.sid], () => resolve());
    });

    const logoutRes = await client.post("/api/auth/logout", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers["set-cookie"]).toBeDefined();
  });

  test("✓ Missing cookie - Should remain idempotent and return 200", async () => {
    const logoutRes = await client.post("/api/auth/logout", {}, { headers });
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers["set-cookie"]).toBeDefined();
  });

  test("✓ Expired refresh token - Should remain idempotent and return 200", async () => {
    const jwt = require("jsonwebtoken");
    const expiredToken = jwt.sign(
      { sub: testUserPublicId, sid: "some-uuid", exp: Math.floor(Date.now() / 1000) - 3600 },
      process.env.JWT_REFRESH_SECRET
    );

    const logoutRes = await client.post("/api/auth/logout", {}, {
      headers: { ...headers, Cookie: `refreshToken=${expiredToken}` }
    });

    expect(logoutRes.status).toBe(200);
  });

  test("✓ Replay token - Should remain idempotent and return 200", async () => {
    // Replayed tokens are essentially tokens whose hash doesn't match the active database hash
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const initialCookie = loginRes.headers["set-cookie"][0].split(";")[0];
    const tokenVal = initialCookie.split("=")[1];
    const decoded = require("jsonwebtoken").decode(tokenVal);

    // Alter hash in DB
    await new Promise((resolve) => {
      db.run("UPDATE user_sessions SET refresh_token_hash = 'different' WHERE id = ?", [decoded.sid], () => resolve());
    });

    const logoutRes = await client.post("/api/auth/logout", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });

    expect(logoutRes.status).toBe(200);
  });

  test("✓ Logout then Refresh fails", async () => {
    // 1. Login
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const initialCookie = loginRes.headers["set-cookie"][0].split(";")[0];

    // 2. Logout
    await client.post("/api/auth/logout", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });

    // 3. Refresh should fail
    const refRes = await client.post("/api/auth/refresh", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });

    expect(refRes.status).toBe(401);
    expect(refRes.data.errorCode).toBe("INVALID_SESSION");
  });

  test("✓ Multiple logout requests remain idempotent", async () => {
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const initialCookie = loginRes.headers["set-cookie"][0].split(";")[0];

    const logoutRes1 = await client.post("/api/auth/logout", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });
    expect(logoutRes1.status).toBe(200);

    const logoutRes2 = await client.post("/api/auth/logout", {}, {
      headers: { ...headers, Cookie: initialCookie }
    });
    expect(logoutRes2.status).toBe(200);
  });
});

describe("GET /api/auth/me - Current User Context", () => {
  const loginPayload = {
    email: "me-test@example.com",
    password: "P@ssw0rdStrength!"
  };

  let testUserId;
  let testUserPublicId;
  let headers;

  beforeEach(async () => {
    const randomIp = `192.168.100.${Math.floor(Math.random() * 254) + 1}`;
    headers = { "X-Forwarded-For": randomIp };

    const bcrypt = require("bcrypt");
    const crypto = require("crypto");
    const passwordHash = await bcrypt.hash(loginPayload.password, 4);
    const publicId = crypto.randomUUID();
    testUserPublicId = publicId;

    testUserId = await new Promise((resolve, reject) => {
      db.run("INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        [publicId, "Me Test User", loginPayload.email, "customer", "active"],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    await new Promise((resolve, reject) => {
      db.run("INSERT INTO user_credentials (user_id, provider, password_hash) VALUES (?, ?, ?)",
        [testUserId, "email", passwordHash],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  test("✓ Valid access token - Should return 200 and user DTO", async () => {
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    expect(loginRes.status).toBe(200);
    const accessToken = loginRes.data.data.accessToken;

    const meRes = await client.get("/api/auth/me", {
      headers: { ...headers, Authorization: `Bearer ${accessToken}` }
    });

    expect(meRes.status).toBe(200);
    expect(meRes.data).toEqual({
      success: true,
      message: "User profile fetched successfully.",
      data: {
        user: {
          public_id: testUserPublicId,
          name: "Me Test User",
          email: loginPayload.email,
          role: "customer",
          status: "active"
        }
      }
    });
  });

  test("✓ Invalid token - Should return 401 UNAUTHORIZED", async () => {
    const meRes = await client.get("/api/auth/me", {
      headers: { ...headers, Authorization: "Bearer invalid-token-value" }
    });

    expect(meRes.status).toBe(401);
    expect(meRes.data.errorCode).toBe("UNAUTHORIZED");
  });

  test("✓ Expired token - Should return 401 UNAUTHORIZED", async () => {
    const jwt = require("jsonwebtoken");
    const expiredToken = jwt.sign(
      { sub: testUserPublicId, role: "customer", sid: "some-uuid", exp: Math.floor(Date.now() / 1000) - 3600 },
      process.env.JWT_ACCESS_SECRET
    );

    const meRes = await client.get("/api/auth/me", {
      headers: { ...headers, Authorization: `Bearer ${expiredToken}` }
    });

    expect(meRes.status).toBe(401);
    expect(meRes.data.errorCode).toBe("UNAUTHORIZED");
  });

  test("✓ Missing Authorization - Should return 401 UNAUTHORIZED", async () => {
    const meRes = await client.get("/api/auth/me", { headers });
    expect(meRes.status).toBe(401);
    expect(meRes.data.errorCode).toBe("UNAUTHORIZED");
  });

  test("✓ Suspended account - Should return 401 USER_SUSPENDED", async () => {
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const accessToken = loginRes.data.data.accessToken;

    // Suspend user directly in DB
    await new Promise((resolve) => {
      db.run("UPDATE users SET status = 'suspended' WHERE id = ?", [testUserId], () => resolve());
    });

    const meRes = await client.get("/api/auth/me", {
      headers: { ...headers, Authorization: `Bearer ${accessToken}` }
    });

    expect(meRes.status).toBe(401);
    expect(meRes.data.errorCode).toBe("USER_SUSPENDED");
  });

  test("✓ Deleted account - Should return 401 UNAUTHORIZED (generic)", async () => {
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const accessToken = loginRes.data.data.accessToken;

    // Delete user directly in DB
    await new Promise((resolve) => {
      db.run("UPDATE users SET status = 'deleted' WHERE id = ?", [testUserId], () => resolve());
    });

    const meRes = await client.get("/api/auth/me", {
      headers: { ...headers, Authorization: `Bearer ${accessToken}` }
    });

    expect(meRes.status).toBe(401);
    expect(meRes.data.errorCode).toBe("UNAUTHORIZED"); // Preference: avoid exposing unnecessary status, return generic 401
  });

  test("✓ User deleted after JWT issuance - Should reject in getMe with generic 401", async () => {
    const loginRes = await client.post("/api/auth/login", loginPayload, { headers });
    const accessToken = loginRes.data.data.accessToken;

    // Delete user profile completely from table
    await new Promise((resolve) => {
      db.run("DELETE FROM users WHERE id = ?", [testUserId], () => resolve());
    });

    const meRes = await client.get("/api/auth/me", {
      headers: { ...headers, Authorization: `Bearer ${accessToken}` }
    });

    expect(meRes.status).toBe(401);
    expect(meRes.data.errorCode).toBe("UNAUTHORIZED");
  });
});

