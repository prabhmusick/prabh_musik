const { AsyncLocalStorage } = require("async_hooks");
const { db, dbContextStore } = require("./db");

const txContextStore = new AsyncLocalStorage();
let transactionQueue = Promise.resolve();

/**
 * @fileoverview D1-Compatible Transaction Abstraction
 *
 * Cloudflare D1 does NOT support SQL transaction-control statements
 * (BEGIN TRANSACTION, COMMIT, ROLLBACK, SAVEPOINT) over its HTTP REST API.
 * All atomic writes must be submitted as a single db.batch() call.
 *
 * This module provides two abstractions:
 *
 * 1. executeTransaction(callback)
 *    For callers that do WRITE-ONLY (no inter-statement lastID/changes dependency
 *    within the callback itself). Collects all tx.run() calls and batches them
 *    atomically via db.batch().
 *
 *    For the two cases that depend on lastID from createUser() (signup and
 *    oauthLogin new user), the SQL for createCredential and createSession uses
 *    subqueries to resolve user_id from the known public_id, so NO intermediate
 *    lastID is required from the batch.
 *
 * 2. executeAtomicBatch(statements)
 *    Direct batch execution when the caller has pre-built PreparedStatements.
 *    Used by orders.repository.createOrder() and
 *    ownerships.repository.insertOwnershipsTransaction().
 *
 * PRODUCTION GUARANTEE: Neither function ever sends BEGIN TRANSACTION, COMMIT,
 * ROLLBACK, or SAVEPOINT to CloudflareD1Database.query().
 *
 * TEST GUARANTEE: MemoryDB receives individual statements sequentially (since
 * MemoryDB.batch() iterates them), preserving existing test semantics.
 */

/**
 * Creates a statement-collector transaction context (tx).
 *
 * All tx.run() calls are captured into a statements array without executing.
 * tx.get() and tx.all() execute immediately (reads are always pass-through).
 * tx.prepare() proxies to db.prepare().
 *
 * Returns { tx, getStatements } where getStatements() returns the collected
 * array of PreparedStatements ready for db.batch().
 *
 * NOTE: This collector is ONLY safe for callbacks where no subsequent tx.run()
 * call depends on the result (lastID, changes) of a previous tx.run().
 * For the signup/oauthLogin new user case this is satisfied because the
 * createCredential and createSession SQL uses public_id subqueries rather than
 * a literal user_id integer obtained from createUser's lastID.
 */
const createStatementCollector = () => {
  const statements = [];

  const tx = {
    run(sql, params, callback) {
      const stmt = db.prepare(sql).bind(...(Array.isArray(params) ? params : []));
      statements.push(stmt);
      // Invoke the node-style callback with a stub result immediately so that
      // promise-based wrappers in repositories can resolve.
      // IMPORTANT: this.lastID and this.changes are NOT available until the
      // batch executes. Any code that reads this.lastID from a tx.run() callback
      // inside executeTransaction MUST use subqueries or pre-generated IDs instead.
      if (typeof callback === "function") {
        process.nextTick(() => {
          callback.call({ lastID: null, changes: 0 }, null);
        });
      }
    },

    get(sql, params, callback) {
      // Reads pass through immediately (not deferred).
      db.get(sql, params, callback);
    },

    all(sql, params, callback) {
      db.all(sql, params, callback);
    },

    prepare(sql) {
      return db.prepare(sql);
    },
  };

  const getStatements = () => statements;

  return { tx, getStatements };
};

/**
 * Executes a transaction callback by collecting all write statements and
 * submitting them atomically via db.batch().
 *
 * Transactions are serialized via a promise queue to prevent concurrent
 * execution from interleaving batch submissions.
 *
 * CALLER CONTRACT:
 *   - The callback MUST NOT depend on this.lastID or this.changes from a tx.run()
 *     inside the same callback to build subsequent SQL parameters.
 *   - For inter-statement ID dependencies, use SQL subqueries (e.g.
 *     SELECT id FROM users WHERE public_id = ?) within the next statement.
 *   - Reads (tx.get, tx.all) execute immediately and may be used freely.
 *
 * @param {function(object): Promise<any>} callback - Async function receiving tx context.
 * @returns {Promise<any>} Resolves to the callback's return value.
 */
const executeTransaction = async (callback) => {
  const currentTx = txContextStore.getStore();
  if (currentTx) {
    return callback(currentTx);
  }

  const runTx = async () => {
    const { tx, getStatements } = createStatementCollector();

    let callbackResult;
    try {
      callbackResult = await txContextStore.run(tx, () => callback(tx));
    } catch (error) {
      // Callback threw before any batch was submitted — nothing to roll back.
      throw error;
    }

    const statements = getStatements();

    if (statements.length > 0) {
      // Submit all collected writes atomically as a single D1 batch.
      // In MemoryDB (test), batch() iterates statements sequentially.
      // In production D1, all-or-nothing semantics are enforced by the API.
      await db.batch(statements);
    }

    return callbackResult;
  };

  const nextPromise = transactionQueue.then(runTx, runTx);
  transactionQueue = nextPromise.catch(() => {});
  return nextPromise;
};

/**
 * Executes an array of pre-built PreparedStatements atomically via db.batch().
 *
 * Use this when the caller has already assembled the complete statement list
 * (e.g. createOrder, insertOwnershipsTransaction).
 *
 * @param {Array} statements - Array of PreparedStatements from db.prepare().bind().
 * @returns {Promise<Array>} Resolves to the batch result array.
 */
const executeAtomicBatch = async (statements) => {
  if (!Array.isArray(statements) || statements.length === 0) {
    return [];
  }
  return db.batch(statements);
};

module.exports = {
  executeTransaction,
  executeAtomicBatch,
  txContextStore,
};
