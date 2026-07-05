const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const dbFile = path.join(__dirname, "..", "..", "Database", "beats.db");
const schemaFile = path.join(__dirname, "..", "..", "Database", "schema.sql");
const seedFile = path.join(
  __dirname,
  "..",
  "..",
  "Database",
  "seed.sql"
);

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) return console.error("Failed to open DB", err);
});

function init() {
  try {
    const exists = fs.existsSync(dbFile);
    const schema = fs.readFileSync(schemaFile, "utf8");
    const seedFile = path.join(__dirname, "..", "..", "Database", "seed.sql");

    function applySchemaAndSeed() {
      db.exec(schema, (err) => {
        if (err) {
          console.error("DB init error:", err);
          return;
        }
        console.log("Database created and initialized.");
        try {
          if (fs.existsSync(seedFile)) {
            const seed = fs.readFileSync(seedFile, "utf8");
            if (seed && seed.trim()) {
              db.exec(seed, (err2) => {
                if (err2) console.error("DB seed error:", err2.message || err2);
                else console.log("Database seeded from seed.sql");
              });
            }
          }
        } catch (e) {
          console.error("Could not apply seed file:", e.message || e);
        }
      });
    }

    if (!exists) {
      // No DB file — apply schema (and seed)
      applySchemaAndSeed();
      return;
    }

    // DB file exists — ensure required tables exist, otherwise apply schema
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
      (err, row) => {
        if (err) {
          console.error("Error checking DB schema:", err.message || err);
          return;
        }
        if (!row) {
          console.log(
            "Database exists but missing tables — initializing schema.",
          );
          applySchemaAndSeed();
        } else {
          console.log("Database file exists and appears initialized.");
          // Dynamically check and create orders and order_items if they don't exist
          db.serialize(() => {
            db.run(`
              CREATE TABLE IF NOT EXISTS orders (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  customer_id INTEGER NOT NULL,
                  total_amount REAL NOT NULL,
                  payment_method TEXT,
                  payment_reference TEXT,
                  transaction_id TEXT,
                  gateway TEXT,
                  status TEXT DEFAULT 'pending',
                  is_deleted INTEGER DEFAULT 0,
                  fulfilled_at DATETIME,
                  fulfillment_status TEXT DEFAULT 'pending',
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(customer_id) REFERENCES users(id)
              )
            `, (err3) => {
              if (err3) console.error("Error creating orders table:", err3.message || err3);
            });
            // Safe migrations helper
            db.all("PRAGMA table_info(orders)", (errTable, rows) => {
              if (errTable || !rows) return;
              const hasFulfilledAt = rows.some(r => r.name === "fulfilled_at");
              const hasFulfillmentStatus = rows.some(r => r.name === "fulfillment_status");
              if (!hasFulfilledAt) {
                db.run("ALTER TABLE orders ADD COLUMN fulfilled_at DATETIME");
              }
              if (!hasFulfillmentStatus) {
                db.run("ALTER TABLE orders ADD COLUMN fulfillment_status TEXT DEFAULT 'pending'");
              }
            });
            db.run(`
              CREATE TABLE IF NOT EXISTS order_items (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  order_id INTEGER NOT NULL,
                  beat_id INTEGER NOT NULL,
                  beat_title TEXT NOT NULL,
                  price REAL NOT NULL,
                  license_type TEXT DEFAULT 'exclusive',
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(order_id) REFERENCES orders(id),
                  FOREIGN KEY(beat_id) REFERENCES beats(id)
              )
            `, (err4) => {
              if (err4) console.error("Error creating order_items table:", err4.message || err4);
            });
            db.run("CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)");
            db.run("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)");
            db.run("CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)");
            db.run("CREATE INDEX IF NOT EXISTS idx_order_items_beat ON order_items(beat_id)");

             db.run(`
               CREATE TABLE IF NOT EXISTS ownerships (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   user_id INTEGER NOT NULL,
                   beat_id INTEGER NOT NULL,
                   order_id INTEGER NOT NULL,
                   license_type TEXT NOT NULL,
                   purchase_price REAL NOT NULL,
                   purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                   download_count INTEGER DEFAULT 0,
                   max_downloads INTEGER,
                   expires_at DATETIME,
                   status TEXT DEFAULT 'active',
                   revoked_at DATETIME,
                   download_token TEXT,
                   last_download_at DATETIME,
                   created_by_order_status TEXT DEFAULT 'paid',
                   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                   FOREIGN KEY(user_id) REFERENCES users(id),
                   FOREIGN KEY(beat_id) REFERENCES beats(id),
                   FOREIGN KEY(order_id) REFERENCES orders(id)
               )
             `, (err5) => {
               if (err5) console.error("Error creating ownerships table:", err5.message || err5);
             });
             db.run("CREATE INDEX IF NOT EXISTS idx_ownerships_user ON ownerships(user_id)");
             db.run("CREATE INDEX IF NOT EXISTS idx_ownerships_beat ON ownerships(beat_id)");
             db.run("CREATE INDEX IF NOT EXISTS idx_ownerships_order ON ownerships(order_id)");
             db.run("CREATE INDEX IF NOT EXISTS idx_ownerships_status ON ownerships(status)");
             db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_ownership ON ownerships(user_id, beat_id, order_id)");

              db.run(`
                CREATE TABLE IF NOT EXISTS download_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ownership_id INTEGER NOT NULL,
                    token TEXT UNIQUE NOT NULL,
                    expires_at DATETIME NOT NULL,
                    used_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(ownership_id) REFERENCES ownerships(id)
                )
              `);
              db.run("CREATE INDEX IF NOT EXISTS idx_download_tokens_val ON download_tokens(token)");
              db.run("CREATE INDEX IF NOT EXISTS idx_download_tokens_owner ON download_tokens(ownership_id)");

              db.run(`
                CREATE TABLE IF NOT EXISTS download_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ownership_id INTEGER NOT NULL,
                    token_id INTEGER,
                    ip_address TEXT,
                    user_agent TEXT,
                    status TEXT NOT NULL,
                    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(ownership_id) REFERENCES ownerships(id),
                    FOREIGN KEY(token_id) REFERENCES download_tokens(id)
                )
              `);
              db.run("CREATE INDEX IF NOT EXISTS idx_download_logs_ownership ON download_logs(ownership_id)");
              db.run("CREATE INDEX IF NOT EXISTS idx_download_logs_date ON download_logs(downloaded_at)");
            });
        }
      },
    );
  } catch (err) {
    console.error("Could not read schema file:", err.message || err);
  }
}

module.exports = { db, init };
