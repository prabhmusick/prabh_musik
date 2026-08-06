const { db } = require("./db");

let transactionQueue = Promise.resolve();

/**
 * Runs a set of SQL commands in a secure SQLite transaction.
 * Automatically issues a ROLLBACK if any database error or callback exception is encountered,
 * otherwise issues a COMMIT.
 *
 * Transaction executions are queued sequentially using a promise chain to prevent concurrent
 * transaction overlap/collision errors on a shared SQLite database connection.
 *
 * @param {function(import('sqlite3').Database): Promise<any>} callback - Code to run inside transaction block.
 * @returns {Promise<any>} Resolves to callback results on success.
 */
const executeTransaction = async (callback) => {
  const runTx = () => new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION", async (err) => {
        if (err) return reject(err);
        try {
          const result = await callback(db);
          db.run("COMMIT", (errCommit) => {
            if (errCommit) {
              db.run("ROLLBACK", () => reject(errCommit));
            } else {
              resolve(result);
            }
          });
        } catch (error) {
          db.run("ROLLBACK", () => reject(error));
        }
      });
    });
  });

  const nextPromise = transactionQueue.then(runTx, runTx);
  transactionQueue = nextPromise.catch(() => {});
  return nextPromise;
};

module.exports = {
  executeTransaction
};
