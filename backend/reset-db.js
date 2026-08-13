const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbFile = path.join(__dirname, "Database", "beats.db");
const schemaFile = path.join(__dirname, "Database", "schema.sql");
const seedFile = path.join(__dirname, "Database", "seed.sql");

// Delete existing DB file
try {
  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
    console.log("Deleted existing database file.");
  }
} catch (e) {
  console.error("Failed to delete database:", e.message);
}

const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  console.log("Applying schema.sql...");
  const schema = fs.readFileSync(schemaFile, "utf8");
  db.exec(schema, (err) => {
    if (err) {
      console.error("Schema execution failed:", err);
      process.exit(1);
    }
    
    console.log("Applying seed.sql...");
    const seed = fs.readFileSync(seedFile, "utf8");
    db.exec(seed, (err2) => {
      db.close();
      if (err2) {
        console.error("Seed execution failed:", err2);
        process.exit(1);
      }
      console.log("Database reset and seeded successfully!");
      process.exit(0);
    });
  });
});
