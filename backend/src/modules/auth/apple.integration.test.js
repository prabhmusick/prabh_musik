/**
 * @fileoverview End-to-End Integration Tests for Apple Sign-In
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Setup clean module-level spies/mocks before requiring the app
const originalGet = axios.get;
axios.get = jest.fn().mockImplementation((url, config) => {
  if (url === "https://appleid.apple.com/auth/keys") {
    return Promise.resolve({
      data: {
        keys: [
          { kid: "key-1", kty: "RSA", n: "mock-n-1", e: "mock-e-1" }
        ]
      }
    });
  }
  return originalGet(url, config);
});

jest.spyOn(crypto, "createPublicKey").mockReturnValue({
  export: jest.fn().mockReturnValue("mock-public-key-pem")
});

const originalVerify = jwt.verify;
const originalDecode = jwt.decode;

jwt.decode = jest.fn().mockImplementation((token, options) => {
  const appleTokens = [
    "valid_apple_token",
    "existing_apple_token",
    "linking_token",
    "unverified_token",
    "suspended_token",
    "deleted_token",
    "no_email_token",
    "nonce_token",
    "rollback_token",
    "concurrent_token",
    "bad_signature_token",
    "expired_token"
  ];
  if (appleTokens.includes(token)) {
    return { header: { kid: "key-1" } };
  }
  if (token === "malformed_token") {
    return null;
  }
  return originalDecode(token, options);
});

jwt.verify = jest.fn().mockImplementation((token, key, options, cb) => {
  if (options && options.issuer === "https://appleid.apple.com") {
    // Intercept Apple ID token verification calls
    if (token === "bad_signature_token") {
      return cb(new Error("invalid signature"));
    }
    if (token === "expired_token") {
      return cb(new jwt.TokenExpiredError("jwt expired", new Date()));
    }

    let sub = "apple-new-sub";
    let email = "new.apple.user@example.com";
    let email_verified = true;
    let nonce = undefined;

    if (token === "existing_apple_token") {
      sub = "existing-apple-sub";
      email = "apple.user@example.com";
    } else if (token === "linking_token") {
      sub = "apple-sub-linked";
      email = "match@example.com";
    } else if (token === "unverified_token") {
      sub = "apple-unverified-sub";
      email = "unverified@example.com";
      email_verified = false;
    } else if (token === "suspended_token") {
      sub = "apple-sub-suspended";
      email = "suspended@example.com";
    } else if (token === "deleted_token") {
      sub = "apple-sub-deleted";
      email = "deleted@example.com";
    } else if (token === "no_email_token") {
      sub = "apple-no-email-sub";
      email = undefined;
    } else if (token === "nonce_token") {
      sub = "apple-nonce-sub";
      email = "nonce@example.com";
      nonce = "actual_nonce";
    } else if (token === "rollback_token") {
      sub = "apple-rollback-sub";
      email = "rollback@example.com";
    } else if (token === "concurrent_token") {
      sub = "apple-concurrent-sub";
      email = "concurrent@example.com";
    }

    return cb(null, {
      sub,
      aud: "com.prabhmusik.app",
      iss: "https://appleid.apple.com",
      email,
      email_verified,
      nonce
    });
  }
  return originalVerify(token, key, options, cb);
});

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "beats_apple_integration_test.db");

// Set environment overrides before loading app/config modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "integration_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "integration_test_refresh_secret_key";
process.env.APPLE_ALLOWED_AUDIENCES = "com.prabhmusik.app,com.prabhmusik.service";
process.env.ACCESS_TOKEN_EXPIRY_SECONDS = "900";
process.env.SESSION_EXPIRY_DAYS = "30";

// Suppress console logging to keep test runners clean
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const app = require("../../app");
const { db } = require("../../config/db");
const authRepository = require("./auth.repository");
const cookieUtil = require("../../utils/cookie");

let server;
let port;
let client;

beforeAll(async () => {
  // Initialize SQLite Schema
  const schemaPath = path.join(__dirname, "..", "..", "..", "Database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Mock cookieUtil.setRefreshCookie to capture cookie headers
  jest.spyOn(cookieUtil, "setRefreshCookie").mockImplementation((res, token) => {
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/auth"
    });
  });

  // Spin up HTTP Server
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
  jest.clearAllMocks();
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("DELETE FROM user_sessions", (err) => {
        if (err) return reject(err);
      });
      db.run("DELETE FROM user_credentials", (err) => {
        if (err) return reject(err);
      });
      db.run("DELETE FROM users", (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
});

describe("Apple Sign-In Integration Tests", () => {

  test("✓ Brand New User - Should create User, Apple Credential, Session, and return tokens", async () => {
    const response = await client.post("/api/auth/apple", { idToken: "valid_apple_token" });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.message).toContain("Logged in with Apple successfully");
    expect(response.data.data.user.email).toBe("new.apple.user@example.com");
    expect(response.data.data.user.role).toBe("customer");
    expect(response.data.data.accessToken).toBeDefined();

    // Verify Set-Cookie header is returned
    const cookieHeader = response.headers["set-cookie"];
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader[0]).toContain("refreshToken=");

    // Verify database entries
    const users = await new Promise((res) => db.all("SELECT * FROM users", [], (e, rows) => res(rows)));
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe("OAuth User");

    const credentials = await new Promise((res) => db.all("SELECT * FROM user_credentials", [], (e, rows) => res(rows)));
    expect(credentials).toHaveLength(1);
    expect(credentials[0].provider).toBe("apple");
    expect(credentials[0].provider_id).toBe("apple-new-sub");
  });

  test("✓ Existing Apple User - Should sign in directly, update last_login_at, and keep credentials clean", async () => {
    // Insert user and Apple credential pre-emptively
    const userId = await new Promise((res, rej) => {
      db.run(
        "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        ["existing-public-id", "Apple User", "apple.user@example.com", "customer", "active"],
        function (err) {
          if (err) rej(err);
          else res(this.lastID);
        }
      );
    });

    await new Promise((res, rej) => {
      db.run(
        "INSERT INTO user_credentials (user_id, provider, provider_id, provider_email) VALUES (?, ?, ?, ?)",
        [userId, "apple", "existing-apple-sub", "apple.user@example.com"],
        (err) => {
          if (err) rej(err);
          else res();
        }
      );
    });

    const response = await client.post("/api/auth/apple", { idToken: "existing_apple_token" });

    expect(response.status).toBe(200);
    expect(response.data.data.user.public_id).toBe("existing-public-id");

    const sessions = await new Promise((res) => db.all("SELECT * FROM user_sessions", [], (e, rows) => res(rows)));
    expect(sessions).toHaveLength(1);
    expect(sessions[0].user_id).toBe(userId);
  });

  test("✓ Existing Email User - Should link account using email match, and keep local credential intact", async () => {
    // Register local email-password user
    const userId = await new Promise((res, rej) => {
      db.run(
        "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        ["email-user-uuid", "Email User", "match@example.com", "customer", "active"],
        function (err) {
          if (err) rej(err);
          else res(this.lastID);
        }
      );
    });

    await new Promise((res, rej) => {
      db.run(
        "INSERT INTO user_credentials (user_id, provider, provider_id, provider_email, password_hash) VALUES (?, ?, ?, ?, ?)",
        [userId, "email", null, "match@example.com", "fake_hash"],
        (err) => {
          if (err) rej(err);
          else res();
        }
      );
    });

    const response = await client.post("/api/auth/apple", { idToken: "linking_token" });

    expect(response.status).toBe(200);

    // Verify 2 credentials are now associated with the user: one email, one apple
    const credentials = await new Promise((res) => db.all("SELECT * FROM user_credentials WHERE user_id = ? ORDER BY provider", [userId], (e, rows) => res(rows)));
    expect(credentials).toHaveLength(2);
    expect(credentials[0].provider).toBe("apple");
    expect(credentials[0].provider_id).toBe("apple-sub-linked");
    expect(credentials[1].provider).toBe("email");
    expect(credentials[1].password_hash).toBe("fake_hash");
  });

  test("✓ Invalid Token - Should respond with 401 Unauthorized", async () => {
    const response = await client.post("/api/auth/apple", { idToken: "bad_signature_token" });

    expect(response.status).toBe(401);
    expect(response.data.success).toBe(false);
    expect(response.data.message).toContain("Apple ID Token verification failed");
  });

  test("✓ Unverified Email - Should return 401 and OAUTH_EMAIL_NOT_VERIFIED", async () => {
    const response = await client.post("/api/auth/apple", { idToken: "unverified_token" });

    expect(response.status).toBe(401);
    expect(response.data.success).toBe(false);
    expect(response.data.errorCode).toBe("OAUTH_EMAIL_NOT_VERIFIED");
  });

  test("✓ Suspended user - Should receive 401 Unauthorized", async () => {
    const userId = await new Promise((res, rej) => {
      db.run(
        "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        ["suspended-apple-uuid", "Suspended User", "suspended@example.com", "customer", "suspended"],
        function (err) {
          if (err) rej(err);
          else res(this.lastID);
        }
      );
    });

    await new Promise((res, rej) => {
      db.run(
        "INSERT INTO user_credentials (user_id, provider, provider_id, provider_email) VALUES (?, ?, ?, ?)",
        [userId, "apple", "apple-sub-suspended", "suspended@example.com"],
        (err) => {
          if (err) rej(err);
          else res();
        }
      );
    });

    const response = await client.post("/api/auth/apple", { idToken: "suspended_token" });

    expect(response.status).toBe(401);
    expect(response.data.success).toBe(false);
    expect(response.data.errorCode).toBe("USER_SUSPENDED");
  });

  test("✓ Deleted user - Should receive 401 Unauthorized", async () => {
    const userId = await new Promise((res, rej) => {
      db.run(
        "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        ["deleted-apple-uuid", "Deleted User", "deleted@example.com", "customer", "deleted"],
        function (err) {
          if (err) rej(err);
          else res(this.lastID);
        }
      );
    });

    await new Promise((res, rej) => {
      db.run(
        "INSERT INTO user_credentials (user_id, provider, provider_id, provider_email) VALUES (?, ?, ?, ?)",
        [userId, "apple", "apple-sub-deleted", "deleted@example.com"],
        (err) => {
          if (err) rej(err);
          else res();
        }
      );
    });

    const response = await client.post("/api/auth/apple", { idToken: "deleted_token" });

    expect(response.status).toBe(401);
    expect(response.data.success).toBe(false);
  });

  test("✓ Missing email claim - Should default email field to empty string without crashing", async () => {
    const response = await client.post("/api/auth/apple", { idToken: "no_email_token" });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.user.email).toBe("");

    // Verify user was created with empty string email
    const users = await new Promise((res) => db.all("SELECT * FROM users", [], (e, rows) => res(rows)));
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("");
  });

  test("✓ Optional Nonce Verification - Rejects on mismatched nonce value", async () => {
    // Send a mismatched nonce in request body
    const response = await client.post("/api/auth/apple", { idToken: "nonce_token", nonce: "wrong_nonce" });

    expect(response.status).toBe(401);
    expect(response.data.success).toBe(false);
    expect(response.data.message).toContain("Nonce mismatch");
  });

  test("✓ Transaction Rollback on Session Setup Crash - User should NOT be created on session crash", async () => {
    const createSessionSpy = jest.spyOn(authRepository, "createSession")
      .mockRejectedValueOnce(new Error("Simulated database failure on session insertion."));

    const response = await client.post("/api/auth/apple", { idToken: "rollback_token" });

    expect(response.status).toBe(500);

    // Verify transaction rollback: users and credentials tables must remain empty
    const users = await new Promise((res) => db.all("SELECT * FROM users", [], (e, rows) => res(rows)));
    expect(users).toHaveLength(0);

    const credentials = await new Promise((res) => db.all("SELECT * FROM user_credentials", [], (e, rows) => res(rows)));
    expect(credentials).toHaveLength(0);

    createSessionSpy.mockRestore();
  });

  test("✓ Concurrency - Parallel first-time Apple logins maintain database consistency without duplication", async () => {
    const [res1, res2] = await Promise.all([
      client.post("/api/auth/apple", { idToken: "concurrent_token" }),
      client.post("/api/auth/apple", { idToken: "concurrent_token" })
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);

    const users = await new Promise((res) => db.all("SELECT * FROM users WHERE email = ?", ["concurrent@example.com"], (e, rows) => res(rows)));
    expect(users).toHaveLength(1);

    const credentials = await new Promise((res) => db.all("SELECT * FROM user_credentials WHERE provider = 'apple' AND provider_id = 'apple-concurrent-sub'", [], (e, rows) => res(rows)));
    expect(credentials).toHaveLength(1);
  });

});
