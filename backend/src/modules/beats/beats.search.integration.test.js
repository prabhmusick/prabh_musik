/**
 * @fileoverview Integration Tests for Beat Search & Filtering Capabilities
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const testDbPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "Database",
  "beats_search_test.db",
);

process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "beats_search_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "beats_search_test_refresh_secret_key";

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

let server;
let port;
let client;

const seedBeats = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create test user
      db.run(
        `INSERT INTO users (id, public_id, email, name, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, "usr_admin", "admin@example.com", "Admin User", "admin", "active"],
        (err) => {
          if (err) return reject(err);

          const beats = [
            [
              1,
              "bt_001",
              "Dark Knight Trap",
              "dark-knight-trap",
              5000,
              "INR",
              "Trap",
              "Dark",
              140,
              "Cmin",
              "Aggressive Punjabi Trap beat with heavy bass",
              "Karan Aujla",
              "audio/bt_001.mp3",
              "published",
              1,
            ],
            [
              2,
              "bt_002",
              "Chill Lofi Sunset",
              "chill-lofi-sunset",
              0,
              "INR",
              "Lofi",
              "Chill",
              85,
              "Amaj",
              "Relaxing study lofi hip hop beat",
              "Sidhu Moose Wala",
              "audio/bt_002.mp3",
              "published",
              1,
            ],
            [
              3,
              "bt_003",
              "Uplifting Pop Anthem",
              "uplifting-pop-anthem",
              120000,
              "INR",
              "Pop",
              "Uplifting",
              120,
              "Gmaj",
              "Catchy radio commercial pop beat",
              "AP Dhillon",
              "audio/bt_003.mp3",
              "published",
              1,
            ],
            [
              4,
              "bt_004",
              "Midnight Drill",
              "midnight-drill",
              75000,
              "INR",
              "Drill",
              "Aggressive",
              145,
              "Fmin",
              "Hard hitting UK drill beat with dark synth strings",
              "Karan Aujla",
              "audio/bt_004.mp3",
              "published",
              1,
            ],
            [
              5,
              "bt_005",
              "Draft Secret Beat",
              "draft-secret-beat",
              10000,
              "INR",
              "Trap",
              "Dark",
              130,
              "Cmin",
              "Unpublished beat draft",
              "Unknown",
              "audio/bt_005.mp3",
              "draft",
              1,
            ],
          ];

          const insertSql = `INSERT INTO beats (
            id, public_id, title, slug, price_amount, currency_code,
            genre, mood, bpm, musical_key, description, related_artist_name,
            audio_key, status, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          let pending = beats.length;
          beats.forEach((beat) => {
            db.run(insertSql, beat, (err2) => {
              if (err2) return reject(err2);
              pending--;
              if (pending === 0) resolve();
            });
          });
        },
      );
    });
  });
};

beforeAll(async () => {
  const schemaPath = path.join(__dirname, "..", "..", "..", "Database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await seedBeats();

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      client = axios.create({
        baseURL: `http://localhost:${port}`,
        validateStatus: () => true,
      });
      resolve();
    });
  });
});

afterAll(async () => {
  consoleLogSpy.mockRestore();
  consoleWarnSpy.mockRestore();
  consoleErrorSpy.mockRestore();

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await new Promise((resolve) => {
    db.close(() => {
      try {
        if (fs.existsSync(testDbPath)) {
          fs.unlinkSync(testDbPath);
        }
      } catch (e) {}
      resolve();
    });
  });
});

describe("Beat Search & Filtering Integration Tests", () => {
  test("1. Should return all published beats when search parameter is empty", async () => {
    const res = await client.get("/api/beats?catalog=1");
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.items).toHaveLength(4); // Excludes draft beat
    expect(res.data.data.total).toBe(4);
  });

  test("2. Should search by title using 'search' parameter", async () => {
    const res = await client.get("/api/beats?catalog=1&search=Knight");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(1);
    expect(res.data.data.items[0].title).toBe("Dark Knight Trap");
  });

  test("3. Should search by title using legacy 'q' parameter for backward compatibility", async () => {
    const res = await client.get("/api/beats?catalog=1&q=Lofi");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(1);
    expect(res.data.data.items[0].title).toBe("Chill Lofi Sunset");
  });

  test("4. Should search by artist name ('related_artist_name')", async () => {
    const res = await client.get("/api/beats?catalog=1&search=Karan");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(2); // Dark Knight Trap & Midnight Drill
  });

  test("5. Should search by genre", async () => {
    const res = await client.get("/api/beats?catalog=1&search=Drill");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(1);
    expect(res.data.data.items[0].title).toBe("Midnight Drill");
  });

  test("6. Should search by mood", async () => {
    const res = await client.get("/api/beats?catalog=1&search=Uplifting");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(1);
    expect(res.data.data.items[0].title).toBe("Uplifting Pop Anthem");
  });

  test("7. Should search by description text", async () => {
    const res = await client.get("/api/beats?catalog=1&search=heavy bass");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(1);
    expect(res.data.data.items[0].title).toBe("Dark Knight Trap");
  });

  test("8. Should search by musical key", async () => {
    const res = await client.get("/api/beats?catalog=1&search=Fmin");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(1);
    expect(res.data.data.items[0].title).toBe("Midnight Drill");
  });

  test("9. Should combine free-text search with genre filter", async () => {
    const res = await client.get("/api/beats?catalog=1&search=Karan&genre=Trap");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(1);
    expect(res.data.data.items[0].title).toBe("Dark Knight Trap");
  });

  test("10. Should combine free-text search with BPM range filter", async () => {
    const res = await client.get("/api/beats?catalog=1&search=Karan&minBpm=141&maxBpm=160");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(1);
    expect(res.data.data.items[0].title).toBe("Midnight Drill");
  });

  test("11. Should combine free-text search with price range filter", async () => {
    const res = await client.get("/api/beats?catalog=1&search=Karan&minPrice=70000");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(1);
    expect(res.data.data.items[0].title).toBe("Midnight Drill");
  });

  test("12. Should correctly calculate total count and page pagination limits", async () => {
    const res = await client.get("/api/beats?catalog=1&search=Karan&limit=1&offset=0");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(1);
    expect(res.data.data.total).toBe(2);
    expect(res.data.data.pages).toBe(2);
  });

  test("13. Should handle special characters and SQL metacharacters safely without errors", async () => {
    const res = await client.get("/api/beats?catalog=1&search=%25%27%22--");
    expect(res.status).toBe(200);
    expect(res.data.data.items).toHaveLength(0);
    expect(res.data.data.total).toBe(0);
  });
});
