const path = require("path");
const fs = require("fs");

// Spy and suppress console.log/error during database connection setup
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "beats_test.db");

// Set up environment overrides before importing modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "test_access_secret_key_123456789";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_key_123456789";
process.env.ACCESS_TOKEN_EXPIRY_SECONDS = "900";
process.env.SESSION_EXPIRY_DAYS = "30";

const { db } = require("../../config/db");
const authService = require("./auth.service");
const usersRepository = require("../users/users.repository");
const authRepository = require("./auth.repository");
const jwtUtil = require("../../utils/jwt");
const logger = require("../../utils/logger");
const ConflictError = require("../../errors/ConflictError");

// Spy on logger calls to verify they are invoked instead of console
let loggerInfoSpy;
let loggerWarnSpy;
let loggerErrorSpy;

beforeAll(async () => {
  loggerInfoSpy = jest.spyOn(logger, "info").mockImplementation(() => {});
  loggerWarnSpy = jest.spyOn(logger, "warn").mockImplementation(() => {});
  loggerErrorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});

  // Wait a short duration to ensure asynchronous db connection open and PRAGMA logging complete
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Initialize schema on test database
  const schemaPath = path.join(__dirname, "..", "..", "..", "Database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

afterAll(async () => {
  // Restore all spies
  loggerInfoSpy.mockRestore();
  loggerWarnSpy.mockRestore();
  loggerErrorSpy.mockRestore();

  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) return reject(err);
      
      // Attempt to delete the test database file
      try {
        if (fs.existsSync(testDbPath)) {
          fs.unlinkSync(testDbPath);
        }
      } catch (e) {
        // Ignore file lock errors during teardown
      }
      resolve();
    });
  });
});

beforeEach(async () => {
  // Clean up table data before each test to prevent cross-contamination
  loggerInfoSpy.mockClear();
  loggerWarnSpy.mockClear();
  loggerErrorSpy.mockClear();

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

describe("Auth Service - signup() Integration Tests", () => {
  const mockUserData = {
    name: "Test User",
    email: "test@example.com",
    password: "Password123!"
  };

  const mockClientInfo = {
    ip: "127.0.0.1",
    userAgent: "Mozilla/5.0",
    deviceName: "Chrome Desktop"
  };

  test("✓ Should successfully register a new user, create session, and return tokens", async () => {
    const result = await authService.signup(mockUserData, mockClientInfo);

    expect(result).toHaveProperty("user");
    expect(result.user.email).toBe("test@example.com");
    expect(result.user.name).toBe("Test User");
    expect(result.user.role).toBe("customer");
    expect(result.user.status).toBe("active");
    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result.expiresIn).toBe(900);

    // Verify user persisted in DB
    const dbUser = await usersRepository.findUserByEmail("test@example.com");
    expect(dbUser).not.toBeNull();
    expect(dbUser.name).toBe("Test User");

    // Verify credential persisted in DB
    const dbCreds = await authRepository.findCredentialByUserId(dbUser.id);
    expect(dbCreds).not.toBeNull();
    expect(dbCreds.provider).toBe("email");

    // Verify session persisted in DB
    const dbSession = await authRepository.findSessionByToken(result.refreshToken);
    expect(dbSession).not.toBeNull();
    expect(dbSession.userId).toBe(dbUser.id);
    expect(dbSession.deviceName).toBe("Chrome Desktop");

    // Verify logger was invoked via audit trailing
    expect(loggerInfoSpy).toHaveBeenCalledWith(expect.objectContaining({
      event: "USER_REGISTERED",
      metadata: { email: "test@example.com" }
    }));
  });

  test("✓ Should throw ConflictError if email is already registered", async () => {
    // 1. First signup
    await authService.signup(mockUserData, mockClientInfo);
    loggerInfoSpy.mockClear();

    // 2. Second signup with same email
    await expect(authService.signup(mockUserData, mockClientInfo)).rejects.toThrow(ConflictError);

    // Verify warning logger was called
    expect(loggerWarnSpy).toHaveBeenCalledWith(expect.objectContaining({
      event: "DUPLICATE_EMAIL",
      email: "test@example.com"
    }));
  });

  test("✓ Access Token generation failure after successful transaction leaves data persisted", async () => {
    // Mock generateAccessToken to fail
    const jwtAccessTokenSpy = jest.spyOn(jwtUtil, "generateAccessToken")
      .mockImplementation(() => {
        throw new Error("Access Token signing failed internally");
      });

    try {
      await expect(authService.signup(mockUserData, mockClientInfo))
        .rejects.toThrow("Access Token signing failed internally");

      // Verify that user, credentials, and session are still persisted despite the post-commit crash
      const dbUser = await usersRepository.findUserByEmail("test@example.com");
      expect(dbUser).not.toBeNull();

      const dbCreds = await authRepository.findCredentialByUserId(dbUser.id);
      expect(dbCreds).not.toBeNull();

      // Check session table directly by querying user sessions
      const sessions = await new Promise((resolve) => {
        db.all("SELECT * FROM user_sessions WHERE user_id = ?", [dbUser.id], (err, rows) => {
          resolve(rows);
        });
      });
      expect(sessions.length).toBe(1);
    } finally {
      jwtAccessTokenSpy.mockRestore();
    }
  });

  test("✓ Duplicate signup via database unique constraint (race condition) returns ConflictError", async () => {
    // We insert a user with email directly to the DB to trigger unique constraint
    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
        ["existing-uuid-123", "Existing User", "test@example.com", "customer", "active"],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Mock findUserByEmail to return null, simulating that the initial service duplicate check
    // passes (e.g. concurrent race condition) and goes straight to the transaction insert
    const findEmailSpy = jest.spyOn(usersRepository, "findUserByEmail")
      .mockResolvedValue(null);

    try {
      await expect(authService.signup(mockUserData, mockClientInfo)).rejects.toThrow(ConflictError);

      // Verify warning logger was called for unique constraint
      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.objectContaining({
        event: "DUPLICATE_EMAIL",
        email: "test@example.com"
      }));
    } finally {
      findEmailSpy.mockRestore();
    }
  });

  test("✓ Unexpected repository persistence failure rolls back database changes", async () => {
    // Mock createUser to throw an unexpected database exception (e.g. database disk full or lock)
    const createUserSpy = jest.spyOn(usersRepository, "createUser")
      .mockRejectedValue(new Error("Disk space fully exhausted"));

    try {
      await expect(authService.signup(mockUserData, mockClientInfo))
        .rejects.toThrow("Disk space fully exhausted");

      // Verify that NO user is created in the database due to rollback
      const users = await new Promise((resolve) => {
        db.all("SELECT * FROM users", [], (err, rows) => {
          resolve(rows);
        });
      });
      expect(users.length).toBe(0);

      // Verify logger.error was called
      expect(loggerErrorSpy).toHaveBeenCalledWith(expect.objectContaining({
        event: "SIGNUP_FAILED_UNEXPECTED",
        error: "Disk space fully exhausted"
      }));
    } finally {
      createUserSpy.mockRestore();
    }
  });
});
