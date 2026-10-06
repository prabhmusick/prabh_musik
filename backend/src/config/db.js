/**
 * @fileoverview Database Client Wrapper (Cloudflare D1 Adapter)
 * Unified Cloudflare D1 Database adapter for Express application.
 * Executes queries via Cloudflare D1 HTTP API in production/development,
 * or using an in-memory pure JS driver fallback when running offline/tests.
 * ZERO native C++ binary dependencies (no sqlite3).
 */

const { AsyncLocalStorage } = require("async_hooks");
const path = require("path");
const fs = require("fs");

const isProduction = process.env.NODE_ENV === "production";

const cloudflareD1Config = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || (isProduction ? "" : "ef604a28e1b051d534c1a8abf3640476"),
  databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || (isProduction ? "" : "c2e9d27f-d877-4627-a588-0456d062dde6"),
  apiToken: process.env.CLOUDFLARE_API_TOKEN || "",
};

// Fail-fast environment check in production
if (isProduction) {
  const missing = [];
  if (!cloudflareD1Config.accountId) missing.push("CLOUDFLARE_ACCOUNT_ID");
  if (!cloudflareD1Config.databaseId) missing.push("CLOUDFLARE_D1_DATABASE_ID");
  if (!cloudflareD1Config.apiToken) missing.push("CLOUDFLARE_API_TOKEN");

  if (missing.length > 0) {
    throw new Error(
      `FATAL CONFIGURATION ERROR: Production Cloudflare D1 database integration requires:\n- ${missing.join("\n- ")}`
    );
  }
}

class MemoryDB {
  constructor() {
    this.tables = {};
    this.autoIncrements = {};
  }

  reset() {
    this.tables = {};
    this.autoIncrements = {};
  }

  query(sql, params = []) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL SECURITY ERROR: MemoryDB is strictly forbidden in production environment.");
    }

    const rawSql = sql.trim();
    const upperSql = rawSql.toUpperCase();

    if (/^(BEGIN|COMMIT|ROLLBACK)/i.test(rawSql)) {
      return { success: true, results: [], meta: { changes: 0 } };
    }

    const pragmaMatch = rawSql.match(/^PRAGMA\s+table_info\(([^)]+)\);?/i);
    if (pragmaMatch) {
      const tableName = pragmaMatch[1].replace(/['"`]/g, "").trim();
      const table = this.tables[tableName];
      if (!table) return { success: true, results: [], meta: {} };
      const results = Object.keys(table.schema || {}).map((colName, idx) => ({
        cid: idx,
        name: colName,
        type: table.schema[colName].type || "TEXT",
        notnull: table.schema[colName].notNull ? 1 : 0,
        dflt_value: table.schema[colName].default || null,
        pk: table.schema[colName].pk ? 1 : 0
      }));
      return { success: true, results, meta: {} };
    }

    if (upperSql.startsWith("CREATE TABLE")) {
      const match = rawSql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(([\s\S]+)\)/i);
      if (match) {
        const tableName = match[1].replace(/['"`]/g, "").trim();
        if (!this.tables[tableName]) {
          this.tables[tableName] = { rows: [], schema: {} };
          this.autoIncrements[tableName] = 1;
        }
        const colDefs = match[2].split(/,(?![^(]*\))/);
        colDefs.forEach((def) => {
          const trimmed = def.trim();
          const colMatch = trimmed.match(/^([^\s]+)\s+([^\s,]+)/);
          if (colMatch && !/^(FOREIGN|PRIMARY|UNIQUE|CHECK|CONSTRAINT)/i.test(colMatch[1])) {
            const colName = colMatch[1].replace(/['"`]/g, "").trim();
            const colType = colMatch[2].toUpperCase();
            const isPk = /PRIMARY\s+KEY/i.test(trimmed);
            const isNotNull = /NOT\s+NULL/i.test(trimmed);
            this.tables[tableName].schema[colName] = {
              type: colType,
              pk: isPk,
              notNull: isNotNull
            };
          }
        });
      }
      return { success: true, results: [], meta: { changes: 0 } };
    }

    if (upperSql.startsWith("ALTER TABLE")) {
      const match = rawSql.match(/ALTER\s+TABLE\s+([^\s]+)\s+ADD\s+COLUMN\s+([^\s]+)\s+([^\s;]+)(?:\s+DEFAULT\s+(.+))?/i);
      if (match) {
        const tableName = match[1].replace(/['"`]/g, "").trim();
        const colName = match[2].replace(/['"`]/g, "").trim();
        const colType = match[3].toUpperCase();
        const defaultValStr = match[4];
        if (this.tables[tableName]) {
          if (!this.tables[tableName].schema[colName]) {
            this.tables[tableName].schema[colName] = { type: colType, pk: false, notNull: false };
            let defaultVal = null;
            if (defaultValStr !== undefined) {
              defaultVal = defaultValStr.replace(/^'|'$/g, "").trim();
              if (!isNaN(Number(defaultVal))) defaultVal = Number(defaultVal);
            }
            this.tables[tableName].rows.forEach((row) => {
              row[colName] = defaultVal;
            });
          }
        }
      }
      return { success: true, results: [], meta: { changes: 0 } };
    }

    if (upperSql.startsWith("DROP TABLE")) {
      const match = rawSql.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([^\s;]+)/i);
      if (match) {
        const tableName = match[1].replace(/['"`]/g, "").trim();
        delete this.tables[tableName];
        delete this.autoIncrements[tableName];
      }
      return { success: true, results: [], meta: { changes: 0 } };
    }

    if (upperSql.startsWith("INSERT INTO")) {
      const insertMatch = rawSql.match(/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+([^\s(]+)\s*(?:\(([^)]+)\))?\s*(?:VALUES\s*\(([\s\S]+)\)|SELECT\s+[\s\S]+)/i);
      if (insertMatch) {
        const tableName = insertMatch[1].replace(/['"`]/g, "").trim();
        if (!this.tables[tableName]) {
          this.tables[tableName] = { rows: [], schema: {} };
          this.autoIncrements[tableName] = 1;
        }

        const colsStr = insertMatch[2];
        const cols = colsStr ? colsStr.split(",").map(c => c.replace(/['"`]/g, "").trim()) : Object.keys(this.tables[tableName].schema);

        if (/SELECT/i.test(insertMatch[0])) {
          if (/WHERE\s+NOT\s+EXISTS/i.test(insertMatch[0])) {
            const subCheckMatch = insertMatch[0].match(/WHERE\s+NOT\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+([^\s]+)\s+WHERE\s+(.+?)\s*\)/i);
            if (subCheckMatch) {
              const checkTable = subCheckMatch[1].replace(/['"`]/g, "").trim();
              const checkCond = subCheckMatch[2];
              const exists = this.evalWhere(checkTable, checkCond, []);
              if (exists.length > 0) {
                return { success: true, results: [], meta: { changes: 0, last_row_id: null } };
              }
            }
          }
          const selectValMatch = insertMatch[0].match(/SELECT\s+(.+?)\s+WHERE/i) || insertMatch[0].match(/SELECT\s+(.+)/i);
          if (selectValMatch) {
            const rawVals = selectValMatch[1].split(/,(?![^(]*\))/).map(v => v.trim().replace(/^'|'$/g, ""));
            const newRow = {};
            cols.forEach((col, idx) => {
              let val = rawVals[idx];
              if (params && params[idx] !== undefined) val = params[idx];
              newRow[col] = val;
            });
            if (!newRow.id && this.tables[tableName].schema.id) {
              newRow.id = this.autoIncrements[tableName]++;
            }
            this.tables[tableName].rows.push(newRow);
            return { success: true, results: [], meta: { changes: 1, last_row_id: newRow.id || this.autoIncrements[tableName] } };
          }
        }

        const newRow = {};
        let paramIdx = 0;
        cols.forEach((col) => {
          if (paramIdx < params.length) {
            newRow[col] = params[paramIdx++];
          }
        });
        if (!newRow.id && (this.tables[tableName].schema.id || cols.length === 0 || !cols.includes("id"))) {
          newRow.id = this.autoIncrements[tableName]++;
        }
        this.tables[tableName].rows.push(newRow);
        return { success: true, results: [], meta: { changes: 1, last_row_id: newRow.id } };
      }
      return { success: true, results: [], meta: { changes: 0 } };
    }

    if (upperSql.startsWith("DELETE FROM")) {
      const match = rawSql.match(/DELETE\s+FROM\s+([^\s;]+)(?:\s+WHERE\s+(.+))?/i);
      if (match) {
        const tableName = match[1].replace(/['"`]/g, "").trim();
        const whereClause = match[2];
        if (this.tables[tableName]) {
          if (!whereClause) {
            const count = this.tables[tableName].rows.length;
            this.tables[tableName].rows = [];
            return { success: true, results: [], meta: { changes: count } };
          }
          const matching = this.evalWhere(tableName, whereClause, params);
          const matchingSet = new Set(matching);
          this.tables[tableName].rows = this.tables[tableName].rows.filter(r => !matchingSet.has(r));
          return { success: true, results: [], meta: { changes: matching.length } };
        }
      }
      return { success: true, results: [], meta: { changes: 0 } };
    }

    if (upperSql.startsWith("UPDATE")) {
      const match = rawSql.match(/UPDATE\s+([^\s]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
      if (match) {
        const tableName = match[1].replace(/['"`]/g, "").trim();
        const setClause = match[2];
        const whereClause = match[3];

        if (this.tables[tableName]) {
          let matching = whereClause ? this.evalWhere(tableName, whereClause, params) : this.tables[tableName].rows;
          const assignments = setClause.split(/,(?![^(]*\))/);
          let paramIdx = whereClause ? (params.length - assignments.length) : 0;
          if (paramIdx < 0) paramIdx = 0;

          matching.forEach((row) => {
            let pIdx = paramIdx;
            assignments.forEach((assign) => {
              const [colRaw, valRaw] = assign.split("=").map(s => s.trim());
              const col = colRaw.replace(/['"`]/g, "");
              if (valRaw === "?") {
                row[col] = params[pIdx++];
              } else if (/^COALESCE/i.test(valRaw)) {
                row[col] = row[col] !== undefined && row[col] !== null ? row[col] : valRaw.match(/COALESCE\s*\(\s*[^,]+,\s*'([^']+)'/i)?.[1] || "";
              } else {
                row[col] = valRaw.replace(/^'|'$/g, "");
              }
            });
          });
          return { success: true, results: [], meta: { changes: matching.length } };
        }
      }
      return { success: true, results: [], meta: { changes: 0 } };
    }

    if (upperSql.startsWith("SELECT")) {
      const match = rawSql.match(/SELECT\s+(?:DISTINCT\s+)?([\s\S]+?)\s+FROM\s+([^\s,;(]+)(?:\s+AS\s+[^\s,;]+)?(?:\s+(?:JOIN|LEFT\s+JOIN)\s+[\s\S]+?)?(?:\s+WHERE\s+([\s\S]+?))?(?:\s+GROUP\s+BY\s+[\s\S]+?)?(?:\s+ORDER\s+BY\s+[\s\S]+?)?(?:\s+LIMIT\s+(\d+))?(?:\s+OFFSET\s+(\d+))?$/i);

      if (match) {
        const selectCols = match[1].trim();
        const tableName = match[2].replace(/['"`]/g, "").trim();
        const whereClause = match[3];
        const limitStr = match[5];
        const offsetStr = match[6];

        let rows = this.tables[tableName] ? [...this.tables[tableName].rows] : [];
        if (whereClause) {
          rows = this.evalWhere(tableName, whereClause, params);
        }

        if (offsetStr) {
          rows = rows.slice(Number(offsetStr));
        }
        if (limitStr) {
          rows = rows.slice(0, Number(limitStr));
        }

        if (selectCols === "*") {
          return { success: true, results: rows.map(r => ({ ...r })), meta: {} };
        }

        const formattedResults = rows.map((row) => {
          const res = {};
          if (selectCols === "1" || selectCols === "COUNT(*)") {
            res[selectCols] = 1;
            return res;
          }
          selectCols.split(",").forEach((colExpr) => {
            const colName = colExpr.trim().split(/\s+AS\s+/i).pop().replace(/['"`]/g, "").split(".").pop();
            res[colName] = row[colName] !== undefined ? row[colName] : null;
          });
          return res;
        });

        return { success: true, results: formattedResults, meta: {} };
      }

      return { success: true, results: [{ "1": 1 }], meta: {} };
    }

    return { success: true, results: [], meta: { changes: 0 } };
  }

  evalWhere(tableName, whereClause, params) {
    if (!this.tables[tableName]) return [];
    let rows = this.tables[tableName].rows;

    const conditions = whereClause.split(/\s+AND\s+/i);
    let paramIdx = 0;

    return rows.filter((row) => {
      let pIdx = paramIdx;
      return conditions.every((cond) => {
        const trimmed = cond.trim();
        const match = trimmed.match(/^([^\s]+)\s*(=|!=|LIKE|IN|IS)\s*(.+)$/i);
        if (!match) return true;
        const col = match[1].replace(/['"`]/g, "").split(".").pop();
        const op = match[2].toUpperCase();
        let target = match[3].trim();

        let val;
        if (target === "?") {
          val = params[pIdx++];
        } else {
          val = target.replace(/^'|'$/g, "");
        }

        const rowVal = row[col];
        if (op === "=") return String(rowVal) === String(val);
        if (op === "!=") return String(rowVal) !== String(val);
        if (op === "LIKE") {
          const regex = new RegExp("^" + String(val).replace(/%/g, ".*") + "$", "i");
          return regex.test(String(rowVal || ""));
        }
        if (op === "IS") {
          if (target.toUpperCase() === "NULL") return rowVal === null || rowVal === undefined;
        }
        return true;
      });
    });
  }
}

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
    return column && row ? (row[column] ?? null) : row;
  }

  async run() {
    const response = await this.all();
    return {
      success: response.success,
      meta: response.meta || {},
    };
  }
}

class CloudflareD1Database {
  constructor(config = cloudflareD1Config) {
    this.config = config || cloudflareD1Config;
    this.endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId || ""}/d1/database/${this.config.databaseId || ""}/query`;
    this.memoryDb = new MemoryDB();
  }

  prepare(sql) {
    return new CloudflareD1PreparedStatement(this, sql);
  }

  async query(sql, params = []) {
    if (process.env.NODE_ENV === "production") {
      if (!this.config.apiToken || !this.config.accountId || !this.config.databaseId) {
        throw new Error("FATAL CONFIGURATION ERROR: Production database query attempted without valid Cloudflare D1 credentials.");
      }
    }

    if (this.config.apiToken) {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        const message =
          payload.errors?.map((error) => error.message).join(", ") ||
          response.statusText;
        throw new Error(`Cloudflare D1 query failed: ${message}`);
      }

      const result = payload.result?.[0] || {};
      return {
        success: true,
        results: result.results || [],
        meta: result.meta || {},
      };
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL SECURITY ERROR: MemoryDB is strictly forbidden in production environment.");
    }

    return this.memoryDb.query(sql, params);
  }

  serialize(callback) {
    if (typeof callback === "function") callback();
  }

  run(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }
    const normalizedSql = sql ? sql.trim().toUpperCase() : "";
    if (/^(BEGIN|COMMIT|ROLLBACK)/.test(normalizedSql)) {
      return process.nextTick(() =>
        callback?.call({ lastID: null, changes: 0 }, null)
      );
    }

    this.prepare(sql)
      .bind(...(params || []))
      .run()
      .then((result) =>
        callback?.call(
          {
            lastID: result.meta.last_row_id ?? null,
            changes: result.meta.changes ?? 0,
          },
          null
        )
      )
      .catch((error) => callback?.(error));
  }

  get(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }
    this.prepare(sql)
      .bind(...(params || []))
      .first()
      .then((row) => callback?.(null, row))
      .catch((error) => callback?.(error, null));
  }

  all(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }
    this.prepare(sql)
      .bind(...(params || []))
      .all()
      .then((result) => callback?.(null, result.results))
      .catch((error) => callback?.(error, []));
  }

  exec(sql, callback) {
    const statements = sql.split(";").map(s => s.trim()).filter(Boolean);
    const runNext = (idx) => {
      if (idx >= statements.length) {
        return callback ? callback(null) : Promise.resolve();
      }
      this.query(statements[idx])
        .then(() => runNext(idx + 1))
        .catch((err) => callback ? callback(err) : Promise.reject(err));
    };

    if (callback) {
      runNext(0);
    } else {
      return new Promise((resolve, reject) => {
        const execNext = (i) => {
          if (i >= statements.length) return resolve();
          this.query(statements[i])
            .then(() => execNext(i + 1))
            .catch(reject);
        };
        execNext(0);
      });
    }
  }

  close(callback) {
    this.memoryDb.reset();
    if (typeof callback === "function") {
      callback(null);
    }
    return Promise.resolve();
  }

  async batch(statements) {
    if (process.env.NODE_ENV === "production") {
      if (!this.config.apiToken || !this.config.accountId || !this.config.databaseId) {
        throw new Error("FATAL CONFIGURATION ERROR: Production database batch attempted without valid Cloudflare D1 credentials.");
      }
    }

    if (this.config.apiToken) {
      const queries = statements.map((statement) => ({
        sql: statement.sql,
        params: statement.params,
      }));
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batch: queries }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error("Cloudflare D1 batch failed");
      }
      return payload.result || [];
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL SECURITY ERROR: MemoryDB is strictly forbidden in production environment.");
    }

    const results = [];
    for (const stmt of statements) {
      const isSelect = stmt.sql.trim().toLowerCase().startsWith("select");
      const res = isSelect ? await stmt.all() : await stmt.run();
      results.push(res);
    }
    return results;
  }
}

const dbContextStore = new AsyncLocalStorage();
const localD1Instance = new CloudflareD1Database(cloudflareD1Config);

const logger = require("../utils/logger");
const metrics = require("../utils/metrics");
const { trace } = require("../utils/tracer");

const traceDatabaseCall = (methodName, fn, activeDb) => {
  return function (...args) {
    const start = process.hrtime.bigint();
    metrics.increment("databaseQueries");

    let callbackIdx = args.length - 1;
    let actualCallback =
      typeof args[callbackIdx] === "function" ? args[callbackIdx] : null;

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
          message: `Slow database operation: db.${methodName} took ${Math.round(durationMs)}ms`,
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

let activeTransactionDepth = 0;

const dbProxy = new Proxy(
  {},
  {
    get(target, prop) {
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

          if (prop === "run") {
            const sqlUpper = sql.trim().toUpperCase();
            const isBegin = sqlUpper.startsWith("BEGIN");
            const isCommit = sqlUpper.startsWith("COMMIT");
            const isRollback = sqlUpper.startsWith("ROLLBACK");

            if (isBegin || isCommit || isRollback) {
              if (isBegin) activeTransactionDepth++;
              if (isCommit || isRollback)
                activeTransactionDepth = Math.max(0, activeTransactionDepth - 1);
              if (actualCallback) {
                process.nextTick(() => {
                  actualCallback.call({ lastID: null, changes: 0 }, null);
                });
              }
              return;
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
                message: `Slow database operation: db.${prop} took ${Math.round(durationMs)}ms`,
              });
            }

            if (actualCallback) {
              if (prop === "run") {
                const runContext = {
                  lastID: result?.meta?.last_row_id ?? result?.lastID ?? null,
                  changes: result?.meta?.changes ?? result?.changes ?? 0,
                };
                actualCallback.call(runContext, err);
              } else if (prop === "all") {
                const rows =
                  result?.results || (Array.isArray(result) ? result : []);
                actualCallback.call(activeDb, err, rows);
              } else {
                actualCallback.call(activeDb, err, result);
              }
            }
          };

          const stmt = activeDb.prepare(sql).bind(...actualParams);
          if (prop === "get") {
            stmt
              .first()
              .then((row) => wrappedCallback(null, row))
              .catch((err) => wrappedCallback(err, null));
          } else if (prop === "all") {
            stmt
              .all()
              .then((res) => wrappedCallback(null, res))
              .catch((err) => wrappedCallback(err, null));
          } else if (prop === "run") {
            stmt
              .run()
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
                if (
                  typeof stmtValue === "function" &&
                  ["all", "first", "run"].includes(stmtProp)
                ) {
                  return trace(
                    "database",
                    `DatabasePreparedStatement.${String(stmtProp)}`,
                    stmtValue.bind(target),
                  );
                }
                return stmtValue;
              },
            });
          };
        }
        return value.bind(activeDb);
      }
      return value;
    },
  },
);

function init() {
  if (process.env.NODE_ENV === "test") {
    return Promise.resolve();
  }
  return localD1Instance
    .prepare(
      "ALTER TABLE worked_with_artists ADD COLUMN show_on_music_production INTEGER NOT NULL DEFAULT 0",
    )
    .run()
    .catch((error) => {
      if (!/duplicate column name/i.test(error.message || "")) {
        throw error;
      }
    })
    .then(() =>
      localD1Instance
        .prepare(
          "UPDATE worked_with_artists SET show_on_music_production = 1 WHERE name IN ('Karan Aujla', 'Sidhu Moose Wala')",
        )
        .run(),
    )
    .then(() =>
      localD1Instance
        .prepare(
          "ALTER TABLE worked_with_artists ADD COLUMN show_on_mix_master INTEGER NOT NULL DEFAULT 0",
        )
        .run()
        .catch((error) => {
          if (!/duplicate column name/i.test(error.message || "")) {
            throw error;
          }
        }),
    )
    .then(() =>
      localD1Instance
        .prepare(
          "ALTER TABLE worked_with_artists ADD COLUMN show_on_lyrics INTEGER NOT NULL DEFAULT 0",
        )
        .run()
        .catch((error) => {
          if (!/duplicate column name/i.test(error.message || "")) {
            throw error;
          }
        }),
    )
    .then(() =>
      localD1Instance
        .prepare(
          "ALTER TABLE worked_with_artists ADD COLUMN show_on_marketing_distribution INTEGER NOT NULL DEFAULT 0",
        )
        .run()
        .catch((error) => {
          if (!/duplicate column name/i.test(error.message || "")) {
            throw error;
          }
        }),
    )
    .then(() =>
      localD1Instance
        .prepare("ALTER TABLE beats ADD COLUMN mood TEXT")
        .run()
        .catch((error) => {
          if (!/duplicate column name/i.test(error.message || "")) {
            throw error;
          }
        }),
    );
}

module.exports = {
  db: dbProxy,
  init,
  dbContextStore,
};
