const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const dbFile =
  process.env.DB_FILE ||
  path.join(__dirname, "..", "..", "Database", "beats.db");
const schemaFile = path.join(__dirname, "..", "..", "Database", "schema.sql");
const seedFile = path.join(__dirname, "..", "..", "Database", "seed.sql");

// Open connection and immediately enable foreign keys support
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error("Failed to open DB:", err);
  } else {
    db.run("PRAGMA foreign_keys = ON;", (errFk) => {
      if (errFk) {
        console.error("Failed to enable SQLite foreign keys:", errFk);
      } else {
        console.log("SQLite Foreign Key support enabled.");
      }
    });
  }
});

function init() {
  try {
    const exists = fs.existsSync(dbFile);
    const schema = fs.readFileSync(schemaFile, "utf8");

    function applySchemaAndSeed() {
      console.log("Initializing database schema...");
      db.exec(schema, (err) => {
        if (err) {
          console.error("DB init error:", err);
          return;
        }
        console.log("Database schema applied successfully.");
        try {
          if (fs.existsSync(seedFile)) {
            const seed = fs.readFileSync(seedFile, "utf8");
            if (seed && seed.trim()) {
              db.exec(seed, (err2) => {
                if (err2) {
                  console.error("DB seed error:", err2.message || err2);
                } else {
                  console.log("Database seeded successfully from seed.sql");
                }
              });
            }
          }
        } catch (e) {
          console.error("Could not apply seed file:", e.message || e);
        }
      });
    }

    if (!exists) {
      applySchemaAndSeed();
      return;
    }

    // Database exists — DO NOT re-apply the full schema or seed on an existing file.
    // Re-initializing an existing DB can destroy user data. Instead, run only
    // non-destructive migrations where possible.
    console.log(
      "Database file exists — skipping destructive re-initialization.",
    );

    // Ensure revoked_reason column exists in user_sessions (Sprint 6 migration).
    // Use a safe conditional add to avoid errors if the column already exists.
    db.get("PRAGMA table_info(user_sessions);", (pragmaErr, pragmaRow) => {
      // We'll attempt to add the column; SQLite will error if it exists — handle gracefully.
      db.run(
        "ALTER TABLE user_sessions ADD COLUMN revoked_reason TEXT;",
        (alterErr) => {
          if (alterErr) {
            if (
              alterErr.message &&
              alterErr.message.toLowerCase().includes("duplicate column")
            ) {
              console.log(
                "Column 'revoked_reason' already exists in 'user_sessions'.",
              );
            } else {
              console.log(
                "Migration notice: could not add 'revoked_reason' (non-fatal):",
                alterErr.message || alterErr,
              );
            }
          } else {
            console.log(
              "Successfully migrated: Added column 'revoked_reason' to 'user_sessions'.",
            );
          }
        },
      );
    });
  } catch (err) {
    console.error("Error during DB file check/read:", err.message || err);
  }
}

module.exports = { db, init };
