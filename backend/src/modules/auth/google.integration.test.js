/**
 * @fileoverview End-to-End Integration Tests for Google Sign-In
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

jest.mock("google-auth-library", () => {
  const mOAuth2Client = {
    verifyIdToken: jest.fn()
  };
  return {
    OAuth2Client: jest.fn(() => mOAuth2Client)
  };
});

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "beats_google_integration_test.db");

// Set env variables and database overrides before loading modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "integration_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "integration_test_refresh_secret_key";
process.env.GOOGLE_CLIENT_ID = "mock-google-client-id";
process.env.ACCESS_TOKEN_EXPIRY_SECONDS = "900";
process.env.SESSION_EXPIRY_DAYS = "30";

// Suppress console output to keep Jest logs clean
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const app = require("../../app");
const { db } = require("../../config/db");
const { OAuth2Client } = require("google-auth-library");
const authRepository = require("./auth.repository");
const cookieUtil = require("../../utils/cookie");

let server;
let port;
let client;
let oauthClientMock;

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

  // Mock cookieUtil.setRefreshCookie to write cookies to inspect response headers
  jest.spyOn(cookieUtil, "setRefreshCookie").mockImplementation((res, token) => {
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/auth"
    });
  });

  oauthClientMock = new OAuth2Client();

  // Spin up Express App
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

describe("Google Authentication Flow Integration Tests", () => {
  
  test("✓ Brand New User - Should create User, Google Credential, Session, and set Cookie", async () => {
    const mockPayload = {
      iss: "https://accounts.google.com",
      sub: "google-sub-789",
      email: "new.user@example.com",
      email_verified: true,
      name: "Google New User",
      picture: "https://lh3.googleusercontent.com/photo.jpg"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    const response = await client.post("/api/auth/google", { idToken: "valid_mock_token" });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.user).toEqual({
      public_id: expect.any(String),
      name: "Google New User",
      email: "new.user@example.com",
      role: "customer",
      status: "active"
    });
    expect(response.data.data.accessToken).toBeDefined();

    // Verify session generated in db
    const users = await new Promise((res) => db.all("SELECT * FROM users", [], (e, rows) => res(rows)));
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("new.user@example.com");

    const credentials = await new Promise((res) => db.all("SELECT * FROM user_credentials", [], (e, rows) => res(rows)));
    expect(credentials).toHaveLength(1);
    expect(credentials[0].provider).toBe("google");
    expect(credentials[0].provider_id).toBe("google-sub-789");
    expect(credentials[0].password_hash).toBeNull();

    const sessions = await new Promise((res) => db.all("SELECT * FROM user_sessions", [], (e, rows) => res(rows)));
    expect(sessions).toHaveLength(1);

    // Verify httpOnly cookie returned in headers
    const setCookieHeaders = response.headers["set-cookie"];
    expect(setCookieHeaders).toBeDefined();
    expect(setCookieHeaders[0]).toContain("refreshToken=");
    expect(setCookieHeaders[0]).toContain("HttpOnly");
  });

  test("✓ Existing Google User - Should sign in directly, update last_login_at, and keep same credential state", async () => {
    // 1. Insert existing Google user manually
    const userId = await new Promise((res, rej) => {
      db.run(
        "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        ["existing-public-id", "Google Old User", "old.google@example.com", "customer", "active"],
        function (err) {
          if (err) rej(err);
          else res(this.lastID);
        }
      );
    });

    await new Promise((res, rej) => {
      db.run(
        "INSERT INTO user_credentials (user_id, provider, provider_id, provider_email, password_hash) VALUES (?, ?, ?, ?, ?)",
        [userId, "google", "google-sub-123", "old.google@example.com", null],
        function (err) {
          if (err) rej(err);
          else res();
        }
      );
    });

    const mockPayload = {
      iss: "accounts.google.com",
      sub: "google-sub-123",
      email: "old.google@example.com",
      email_verified: true,
      name: "Google Old User",
      picture: ""
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    const response = await client.post("/api/auth/google", { idToken: "old_user_token" });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.user.public_id).toBe("existing-public-id");

    const usersAfter = await new Promise((res) => db.all("SELECT * FROM users", [], (e, rows) => res(rows)));
    expect(usersAfter).toHaveLength(1);
    expect(usersAfter[0].last_login_at).toBeDefined();

    const credentialsAfter = await new Promise((res) => db.all("SELECT * FROM user_credentials", [], (e, rows) => res(rows)));
    expect(credentialsAfter).toHaveLength(1);
  });

  test("✓ Existing Email User - Should link account using email match, and keep email credential intact", async () => {
    // 1. Insert user with local email credentials
    const userId = await new Promise((res, rej) => {
      db.run(
        "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        ["email-user-uuid", "Email Owner", "existing.email@example.com", "customer", "active"],
        function (err) {
          if (err) rej(err);
          else res(this.lastID);
        }
      );
    });

    await new Promise((res, rej) => {
      db.run(
        "INSERT INTO user_credentials (user_id, provider, provider_id, provider_email, password_hash) VALUES (?, ?, ?, ?, ?)",
        [userId, "email", null, null, "hashed_password_signature"],
        function (err) {
          if (err) rej(err);
          else res();
        }
      );
    });

    const mockPayload = {
      iss: "https://accounts.google.com",
      sub: "google-sub-456",
      email: "existing.email@example.com",
      email_verified: true,
      name: "Google Linked Name",
      picture: "https://lh3.googleusercontent.com/another.jpg"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    const response = await client.post("/api/auth/google", { idToken: "linking_token" });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.user.email).toBe("existing.email@example.com");

    // Must have linked Google credential while keeping existing email credential
    const credentials = await new Promise((res) => db.all("SELECT * FROM user_credentials ORDER BY provider ASC", [], (e, rows) => res(rows)));
    expect(credentials).toHaveLength(2);
    expect(credentials[0].provider).toBe("email");
    expect(credentials[0].password_hash).toBe("hashed_password_signature");
    expect(credentials[1].provider).toBe("google");
    expect(credentials[1].provider_id).toBe("google-sub-456");
    expect(credentials[1].password_hash).toBeNull();
  });

  test("✓ Invalid Token - Should respond with 401 Unauthorized", async () => {
    oauthClientMock.verifyIdToken.mockRejectedValue(new Error("Invalid ID Token signature"));

    const response = await client.post("/api/auth/google", { idToken: "bad_signature_token" });

    expect(response.status).toBe(401);
    expect(response.data.success).toBe(false);
    expect(response.data.message).toContain("Google ID Token verification failed");
  });

  test("✓ Missing idToken parameter - Should return 400 Bad Request", async () => {
    const response = await client.post("/api/auth/google", {});
    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
    expect(response.data.message).toContain("Google ID Token is required");
  });

  test("✓ Transaction Rollback on Session Error - Brand new user should NOT be created on session setup crash", async () => {
    const createSessionSpy = jest.spyOn(authRepository, "createSession")
      .mockRejectedValueOnce(new Error("Simulated database failure on session insertion."));

    const mockPayload = {
      iss: "https://accounts.google.com",
      sub: "google-rollback-sub",
      email: "rollback@example.com",
      email_verified: true,
      name: "Rollback User"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    const response = await client.post("/api/auth/google", { idToken: "rollback_test_token" });

    expect(response.status).toBe(500);

    // Verify transaction rollback: users and credentials tables must remain empty
    const users = await new Promise((res) => db.all("SELECT * FROM users", [], (e, rows) => res(rows)));
    expect(users).toHaveLength(0);

    const credentials = await new Promise((res) => db.all("SELECT * FROM user_credentials", [], (e, rows) => res(rows)));
    expect(credentials).toHaveLength(0);

    createSessionSpy.mockRestore();
  });

  test("✓ Security - Unverified email returns 401 and OAUTH_EMAIL_NOT_VERIFIED code", async () => {
    const mockPayload = {
      iss: "https://accounts.google.com",
      sub: "google-unverified-sub",
      email: "unverified@example.com",
      email_verified: false,
      name: "Unverified Google User"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    const response = await client.post("/api/auth/google", { idToken: "unverified_token" });

    expect(response.status).toBe(401);
    expect(response.data.success).toBe(false);
    expect(response.data.errorCode).toBe("OAUTH_EMAIL_NOT_VERIFIED");
    expect(response.data.message).toContain("Google email is not verified");
  });

  test("✓ Security - Suspended user should receive 401 Unauthorized", async () => {
    const userId = await new Promise((res, rej) => {
      db.run(
        "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        ["suspended-uuid", "Suspended User", "suspended@example.com", "customer", "suspended"],
        function (err) {
          if (err) rej(err);
          else res(this.lastID);
        }
      );
    });

    await new Promise((res, rej) => {
      db.run(
        "INSERT INTO user_credentials (user_id, provider, provider_id, provider_email, password_hash) VALUES (?, ?, ?, ?, ?)",
        [userId, "google", "google-sub-suspended", "suspended@example.com", null],
        function (err) {
          if (err) rej(err);
          else res();
        }
      );
    });

    const mockPayload = {
      iss: "accounts.google.com",
      sub: "google-sub-suspended",
      email: "suspended@example.com",
      email_verified: true,
      name: "Suspended User"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    const response = await client.post("/api/auth/google", { idToken: "suspended_token" });

    expect(response.status).toBe(401);
    expect(response.data.success).toBe(false);
    expect(response.data.errorCode).toBe("USER_SUSPENDED");
  });

  test("✓ Security - Deleted user should receive 401 Unauthorized", async () => {
    const userId = await new Promise((res, rej) => {
      db.run(
        "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        ["deleted-uuid", "Deleted User", "deleted@example.com", "customer", "deleted"],
        function (err) {
          if (err) rej(err);
          else res(this.lastID);
        }
      );
    });

    await new Promise((res, rej) => {
      db.run(
        "INSERT INTO user_credentials (user_id, provider, provider_id, provider_email, password_hash) VALUES (?, ?, ?, ?, ?)",
        [userId, "google", "google-sub-deleted", "deleted@example.com", null],
        function (err) {
          if (err) rej(err);
          else res();
        }
      );
    });

    const mockPayload = {
      iss: "accounts.google.com",
      sub: "google-sub-deleted",
      email: "deleted@example.com",
      email_verified: true,
      name: "Deleted User"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    const response = await client.post("/api/auth/google", { idToken: "deleted_token" });

    expect(response.status).toBe(401);
    expect(response.data.success).toBe(false);
  });

  test("✓ Concurrency - Running parallel first-time login requests maintains database consistency without duplicates", async () => {
    const mockPayload = {
      iss: "https://accounts.google.com",
      sub: "google-concurrent-sub",
      email: "concurrent@example.com",
      email_verified: true,
      name: "Concurrent User"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    const [res1, res2] = await Promise.all([
      client.post("/api/auth/google", { idToken: "concurrent_token" }),
      client.post("/api/auth/google", { idToken: "concurrent_token" })
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);

    const users = await new Promise((res) => db.all("SELECT * FROM users WHERE email = ?", ["concurrent@example.com"], (e, rows) => res(rows)));
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe("Concurrent User");

    const credentials = await new Promise((res) => db.all("SELECT * FROM user_credentials WHERE provider = 'google' AND provider_id = 'google-concurrent-sub'", [], (e, rows) => res(rows)));
    expect(credentials).toHaveLength(1);
  });

});
