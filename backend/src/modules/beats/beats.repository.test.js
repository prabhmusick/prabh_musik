process.env.DB_FILE = ":memory:";

const { db } = require("../../config/db");
const beatsRepository = require("./beats.repository");

beforeAll(async () => {
  await new Promise((resolve, reject) => {
    db.exec(
      `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          public_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT DEFAULT 'customer',
          status TEXT DEFAULT 'active'
        );

        CREATE TABLE artists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          public_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          image_key TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE beats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          public_id TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          price_amount INTEGER NOT NULL DEFAULT 0,
          currency_code TEXT NOT NULL DEFAULT 'INR',
          genre TEXT,
          bpm INTEGER,
          musical_key TEXT,
          description TEXT,
          related_artist_name TEXT,
          related_artist_image_key TEXT,
          artist_id INTEGER,
          play_count INTEGER NOT NULL DEFAULT 0,
          is_trending INTEGER NOT NULL DEFAULT 0 CHECK(is_trending IN (0, 1)),
          audio_key TEXT NOT NULL,
          cover_key TEXT,
          banner_key TEXT,
          duration INTEGER,
          status TEXT NOT NULL DEFAULT 'draft',
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT
        );
      `,
      (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      },
    );
  });
});

afterAll(async () => {
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
});

beforeEach(async () => {
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("DELETE FROM beats", (beatErr) => {
        if (beatErr) {
          reject(beatErr);
          return;
        }

        db.run("DELETE FROM users", (userErr) => {
          if (userErr) {
            reject(userErr);
            return;
          }

          db.run(
            "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
            ["usr_test_1", "Test User", "test@example.com", "admin", "active"],
            (insertErr) => {
              if (insertErr) {
                reject(insertErr);
                return;
              }

              db.get(
                "SELECT id FROM users WHERE email = ?",
                ["test@example.com"],
                (selectErr, row) => {
                  if (selectErr) {
                    reject(selectErr);
                    return;
                  }

                  global.__testUserId = row?.id ?? 1;
                  resolve();
                },
              );
            },
          );
        });
      });
    });
  });
});

describe("beats repository createBeat", () => {
  test("creates a beat row with the expected payload", async () => {
    const beatData = {
      public_id: "bt_test_001",
      title: "Midnight Drive",
      slug: "midnight-drive",
      price_amount: 250,
      currency_code: "INR",
      genre: "Trap",
      bpm: 96,
      musical_key: "Cmin",
      description: "A moody beat for late-night sessions.",
      related_artist_name: "Test Artist",
      related_artist_image_key: "artists/test-artist.jpg",
      artist_id: null,
      play_count: 0,
      is_trending: true,
      audio_key: "audio/bt_test_001.mp3",
      cover_key: "covers/bt_test_001.jpg",
      banner_key: "banners/bt_test_001.jpg",
      duration: 180,
      status: "draft",
      created_by: global.__testUserId ?? 1,
    };

    const createdBeat = await beatsRepository.createBeat(beatData);

    expect(createdBeat).not.toBeNull();
    expect(createdBeat.public_id).toBe("bt_test_001");
    expect(createdBeat.title).toBe("Midnight Drive");
    expect(createdBeat.status).toBe("draft");
    expect(createdBeat.audio_key).toBe("audio/bt_test_001.mp3");
  });
});