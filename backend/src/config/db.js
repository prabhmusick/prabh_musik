/**
 * @fileoverview Database Client Wrapper (Cloudflare D1 Adapter)
 * Resolves request-bound D1 bindings, supports Cloudflare's D1 API for the
 * Express deployment, and emulates the D1 API locally using sqlite3.
 */

const { AsyncLocalStorage } = require("async_hooks");
const path = require("path");
const fs = require("fs");

const cloudflareD1Config = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN
};

const isCloudflareD1 = process.env.DB_MODE === "cloudflare";

class CloudflareD1PreparedStatement {
  constructor(database, sql, params = []) {
    this.database = database;
    this.sql = sql;
    this.params = params;
  }

  bind(...params) {
    return new CloudflareD1PreparedStatement(this.database, this.sql, params);
  }

  all() {
    return this.database.query(this.sql, this.params);
  }

  async first(column) {
    const response = await this.all();
    const row = response.results[0] || null;
    return column && row ? row[column] ?? null : row;
  }

  async run() {
    const response = await this.all();
    return {
      success: response.success,
      meta: response.meta || {}
    };
  }
}

class CloudflareD1Database {
  constructor(config) {
    this.config = config;
    this.endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`;
  }

  prepare(sql) {
    return new CloudflareD1PreparedStatement(this, sql);
  }

  async query(sql, params = []) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params })
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      const message = payload.errors?.map((error) => error.message).join(", ") || response.statusText;
      throw new Error(`Cloudflare D1 query failed: ${message}`);
    }

    const result = payload.result?.[0] || {};
    return {
      success: true,
      results: result.results || [],
      meta: result.meta || {}
    };
  }

  // Express-era repositories use these callbacks for transaction boundaries.
  // D1 requests are individually committed; batch() should be used for strict
  // atomicity when a multi-statement operation needs it.
  serialize(callback) {
    callback();
  }

  run(sql, params, callback) {
    const normalizedSql = sql.trim().toUpperCase();
    if (/^(BEGIN|COMMIT|ROLLBACK)/.test(normalizedSql)) {
      return process.nextTick(() => callback?.call({ lastID: null, changes: 0 }, null));
    }

    this.prepare(sql).bind(...(params || [])).run()
      .then((result) => callback?.call({
        lastID: result.meta.last_row_id ?? null,
        changes: result.meta.changes ?? 0
      }, null))
      .catch((error) => callback?.(error));
  }

  get(sql, params, callback) {
    this.prepare(sql).bind(...(params || [])).first()
      .then((row) => callback?.(null, row))
      .catch((error) => callback?.(error, null));
  }

  all(sql, params, callback) {
    this.prepare(sql).bind(...(params || [])).all()
      .then((result) => callback?.(null, result.results))
      .catch((error) => callback?.(error, []));
  }

  async batch(statements) {
    const queries = statements.map((statement) => ({
      sql: statement.sql,
      params: statement.params
    }));
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ batch: queries })
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error("Cloudflare D1 batch failed");
    }
    return payload.result || [];
  }
}

// 1. Thread-safe execution context for request-bound D1 bindings in serverless/workers environments
const dbContextStore = new AsyncLocalStorage();

/**
 * Emulates Cloudflare D1's D1PreparedStatement API using local sqlite3.
 */
class D1PreparedStatement {
  constructor(sqliteDb, sql, params = []) {
    this.sqliteDb = sqliteDb;
    this.sql = sql;
    this.params = params;
  }

  /**
   * Binds positional parameters to placeholders in the SQL query.
   * @param {...any} params - Arguments matching positional placeholders.
   * @returns {D1PreparedStatement} New statement instance with parameters bound.
   */
  bind(...params) {
    return new D1PreparedStatement(this.sqliteDb, this.sql, params);
  }

  /**
   * Runs queries returning multiple rows (e.g. SELECT).
   * @returns {Promise<{success: boolean, results: Array<object>, meta: object}>}
   */
  all() {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(this.sql, this.params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            success: true,
            results: rows || [],
            meta: { duration: 0 } // Performance metrics are mock in local dev
          });
        }
      });
    });
  }

  /**
   * Runs queries returning a single row, or a single column value.
   * @param {string} [column] - Optional specific column name to extract.
   * @returns {Promise<object|any|null>} Single row object, raw column value, or null.
   */
  first(column) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.get(this.sql, this.params, (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else if (column) {
          resolve(row[column] !== undefined ? row[column] : null);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Runs mutating queries returning execution metadata (e.g. INSERT, UPDATE, DELETE).
   * @returns {Promise<{success: boolean, meta: {changes: number, last_row_id: number, duration: number}}>}
   */
  run() {
    const self = this;
    return new Promise((resolve, reject) => {
      this.sqliteDb.run(this.sql, this.params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            success: true,
            meta: {
              changes: this.changes,
              last_row_id: this.lastID,
              duration: 0
            }
          });
        }
      });
    });
  }
}

/**
 * Emulates Cloudflare D1's D1Database API using local sqlite3.
 */
class D1DatabaseMock {
  constructor(sqliteDb) {
    this.sqliteDb = sqliteDb;
  }

  /**
   * Prepares an SQL query string for execution.
   * @param {string} sql - SQL command template.
   * @returns {D1PreparedStatement}
   */
  prepare(sql) {
    return new D1PreparedStatement(this.sqliteDb, sql);
  }

  /**
   * Executes a batch transaction of multiple D1PreparedStatement commands.
   * If any fails, the entire batch is rolled back.
   * @param {Array<D1PreparedStatement>} statements - List of prepared statements.
   * @returns {Promise<Array<object>>} Array of results for each statement.
   */
  batch(statements) {
    if (!Array.isArray(statements) || statements.length === 0) {
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      this.sqliteDb.serialize(() => {
        this.sqliteDb.run("BEGIN TRANSACTION", (beginErr) => {
          if (beginErr) return reject(beginErr);

          const execPromises = statements.map((stmt) => {
            // Determine if statement is mutating or selecting to run appropriate command
            const isSelect = stmt.sql.trim().toLowerCase().startsWith("select");
            return isSelect ? stmt.all() : stmt.run();
          });

          Promise.all(execPromises)
            .then((results) => {
              this.sqliteDb.run("COMMIT", (commitErr) => {
                if (commitErr) {
                  this.sqliteDb.run("ROLLBACK", () => reject(commitErr));
                } else {
                  resolve(results);
                }
              });
            })
            .catch((batchErr) => {
              this.sqliteDb.run("ROLLBACK", () => reject(batchErr));
            });
        });
      });
    });
  }
}

// Ensure prototype has fallback methods pointing directly to sqliteDb for local environment runtime safety
["exec", "close", "serialize", "run", "get", "all"].forEach((method) => {
  D1DatabaseMock.prototype[method] = function (...args) {
    return this.sqliteDb[method](...args);
  };
});

// 2. Initialize the Local Development Driver Instance
const sqlite3 = require("sqlite3").verbose();
const dbFile = process.env.DB_FILE || path.join(__dirname, "..", "..", "Database", "beats.db");
if (isCloudflareD1) {
  const missing = Object.entries(cloudflareD1Config)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`DB_MODE=cloudflare requires: ${missing.join(", ")}`);
  }
}

const sqliteDb = isCloudflareD1 ? null : new sqlite3.Database(dbFile);

// Enable SQLite foreign keys on connection startup
if (sqliteDb) {
  sqliteDb.run("PRAGMA foreign_keys = ON;");
}

const localD1Instance = isCloudflareD1
  ? new CloudflareD1Database(cloudflareD1Config)
  : new D1DatabaseMock(sqliteDb);

const logger = require("../utils/logger");
const metrics = require("../utils/metrics");
const { trace } = require("../utils/tracer");

const traceDatabaseCall = (methodName, fn, activeDb) => {
  return function (...args) {
    const start = process.hrtime.bigint();
    metrics.increment("databaseQueries");

    let callbackIdx = args.length - 1;
    let actualCallback = typeof args[callbackIdx] === "function" ? args[callbackIdx] : null;

    const wrappedCallback = function (err, ...cbArgs) {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;

      if (err) {
        metrics.recordError("Database");
      }

      if (durationMs > 200) {
        logger.warn({
          event: "SLOW_OPERATION",
          module: "database",
          operation: `db.${methodName}`,
          duration: Math.round(durationMs),
          severity: "warning",
          message: `Slow database operation: db.${methodName} took ${Math.round(durationMs)}ms`
        });
      }

      if (actualCallback) {
        actualCallback.apply(this, [err, ...cbArgs]);
      }
    };

    if (actualCallback) {
      args[callbackIdx] = wrappedCallback;
    } else {
      args.push(wrappedCallback);
    }

    return fn.apply(activeDb, args);
  };
};

// 3. Setup global JS Proxy to switch between Local and Worker context seamlessly
let activeTransactionDepth = 0;

const dbProxy = new Proxy({}, {
  get(target, prop) {
    // If AsyncLocalStorage contains a bound D1 instance, route to it (production Worker)
    const context = dbContextStore.getStore();
    const activeDb = context && context.db ? context.db : localD1Instance;

    if (["get", "run", "all"].includes(prop)) {
      return function (sql, params, callback) {
        let actualParams = params;
        let actualCallback = callback;
        if (typeof params === "function") {
          actualCallback = params;
          actualParams = [];
        } else if (!actualParams) {
          actualParams = [];
        }

        // Intercept raw SQL transaction commands to support nested savepoints/ignores
        if (prop === "run") {
          const sqlUpper = sql.trim().toUpperCase();
          const isBegin = sqlUpper.startsWith("BEGIN");
          const isCommit = sqlUpper.startsWith("COMMIT");
          const isRollback = sqlUpper.startsWith("ROLLBACK");

          // Cloudflare D1 rejects SQL transaction statements. D1 automatically
          // commits each query; leave the legacy transaction callback flow
          // intact without sending BEGIN/COMMIT/ROLLBACK over the network.
          if (isCloudflareD1 && (isBegin || isCommit || isRollback)) {
            if (isBegin) activeTransactionDepth++;
            if (isCommit || isRollback) activeTransactionDepth = Math.max(0, activeTransactionDepth - 1);
            if (actualCallback) {
              process.nextTick(() => {
                actualCallback.call({ lastID: null, changes: 0 }, null);
              });
            }
            return;
          }

          if (isBegin) {
            activeTransactionDepth++;
            if (activeTransactionDepth > 1) {
              if (actualCallback) {
                process.nextTick(() => {
                  actualCallback.call({ lastID: null, changes: 0 }, null);
                });
              }
              return;
            }
          } else if (isCommit) {
            activeTransactionDepth--;
            if (activeTransactionDepth > 0) {
              if (actualCallback) {
                process.nextTick(() => {
                  actualCallback.call({ lastID: null, changes: 0 }, null);
                });
              }
              return;
            }
            if (activeTransactionDepth < 0) {
              activeTransactionDepth = 0;
            }
          } else if (isRollback) {
            activeTransactionDepth = 0;
          }
        }

        const start = process.hrtime.bigint();
        metrics.increment("databaseQueries");

        const wrappedCallback = function (err, result) {
          const end = process.hrtime.bigint();
          const durationMs = Number(end - start) / 1e6;

          if (err) {
            metrics.recordError("Database");
          }

          if (durationMs > 200) {
            logger.warn({
              event: "SLOW_OPERATION",
              module: "database",
              operation: `db.${prop}`,
              duration: Math.round(durationMs),
              severity: "warning",
              message: `Slow database operation: db.${prop} took ${Math.round(durationMs)}ms`
            });
          }

          if (actualCallback) {
            if (prop === "run") {
              const runContext = {
                lastID: result?.meta?.last_row_id ?? result?.lastID ?? null,
                changes: result?.meta?.changes ?? result?.changes ?? 0
              };
              actualCallback.call(runContext, err);
            } else if (prop === "all") {
              const rows = result?.results || (Array.isArray(result) ? result : []);
              actualCallback.call(activeDb, err, rows);
            } else {
              // get
              actualCallback.call(activeDb, err, result);
            }
          }
        };

        const stmt = activeDb.prepare(sql).bind(...actualParams);
        if (prop === "get") {
          stmt.first()
            .then((row) => wrappedCallback(null, row))
            .catch((err) => wrappedCallback(err, null));
        } else if (prop === "all") {
          stmt.all()
            .then((res) => wrappedCallback(null, res))
            .catch((err) => wrappedCallback(err, null));
        } else if (prop === "run") {
          stmt.run()
            .then((res) => wrappedCallback(null, res))
            .catch((err) => wrappedCallback(err, null));
        }
      };
    }

    const value = activeDb[prop];
    if (typeof value === "function") {
      if (prop === "constructor") {
        return value;
      }
      if (prop === "exec") {
        return traceDatabaseCall(String(prop), value, activeDb);
      }
      if (prop === "prepare") {
        return function (...args) {
          const stmt = value.apply(activeDb, args);
          return new Proxy(stmt, {
            get(target, stmtProp) {
              const stmtValue = target[stmtProp];
              if (typeof stmtValue === "function" && ["all", "first", "run"].includes(stmtProp)) {
                return trace("database", `DatabasePreparedStatement.${String(stmtProp)}`, stmtValue.bind(target));
              }
              return stmtValue;
            }
          });
        };
      }
      return value.bind(activeDb);
    }
    return value;
  }
});

// 4. Initialisation interface (maintained for application bootstrap compatibility)
function init() {
  if (isCloudflareD1) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    try {
      const schemaFile = path.join(__dirname, "..", "..", "Database", "schema.sql");
      const seedFile = path.join(__dirname, "..", "..", "Database", "seed.sql");

      const exists = fs.existsSync(dbFile);
      if (!exists) {
        console.log("Initializing database schema...");
        const schema = fs.readFileSync(schemaFile, "utf8");
        sqliteDb.exec(schema, (err) => {
          if (err) {
            console.error("DB init error:", err);
            return reject(err);
          }
          console.log("Database schema applied successfully.");
          try {
            if (fs.existsSync(seedFile)) {
              const seed = fs.readFileSync(seedFile, "utf8");
              if (seed && seed.trim()) {
                sqliteDb.exec(seed, (err2) => {
                  if (err2) {
                    console.error("DB seed error:", err2.message || err2);
                  } else {
                    console.log("Database seeded successfully from seed.sql");
                  }
                  resolve();
                });
              } else {
                resolve();
              }
            } else {
              resolve();
            }
          } catch (e) {
            console.error("Could not apply seed file:", e.message || e);
            resolve();
          }
        });
      } else {
        console.log("Database file exists — skipping destructive re-initialization.");
        // Ensure revoked_reason column exists in user_sessions (Sprint 6 migration).
        sqliteDb.get("PRAGMA table_info(user_sessions);", (pragmaErr, pragmaRow) => {
          sqliteDb.run(
            "ALTER TABLE user_sessions ADD COLUMN revoked_reason TEXT;",
            (alterErr) => {
              if (alterErr) {
                if (
                  alterErr.message &&
                  alterErr.message.toLowerCase().includes("duplicate column")
                ) {
                  console.log("Column 'revoked_reason' already exists in 'user_sessions'.");
                } else {
                  console.log(
                    "Migration notice: could not add 'revoked_reason' (non-fatal):",
                    alterErr.message || alterErr
                  );
                }
              } else {
                console.log("Successfully migrated: Added column 'revoked_reason' to 'user_sessions'.");
              }
              resolve();
            }
          );
        });
      }
    } catch (err) {
      console.error("Error during DB file check/read:", err.message || err);
      resolve();
    }
  });
}

module.exports = {
  db: dbProxy,
  init,
  dbContextStore // Exported for request-binding middleware context setup
};
