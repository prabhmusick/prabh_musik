/**
 * @fileoverview Database Client Wrapper (Cloudflare D1 Adapter)
 * Resolves request-bound D1 bindings in production and emulates the D1 API locally using sqlite3.
 */

const { AsyncLocalStorage } = require("async_hooks");
const path = require("path");

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
const sqliteDb = new sqlite3.Database(dbFile);

// Enable SQLite foreign keys on connection startup
sqliteDb.run("PRAGMA foreign_keys = ON;");

const localD1Instance = new D1DatabaseMock(sqliteDb);

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
  return new Promise((resolve) => {
    // Local SQLite requires no schema execution here (handled via wrangler migrations)
    resolve();
  });
}

module.exports = {
  db: dbProxy,
  init,
  dbContextStore // Exported for request-binding middleware context setup
};
