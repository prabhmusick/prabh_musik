/**
 * @fileoverview Database Transaction Controller
 * Isolates connection initialization from transaction execution scopes.
 */

const { db } = require("./db");

/**
 * Runs a set of SQL commands in a secure SQLite transaction.
 * Automatically issues a ROLLBACK if any database error or callback exception is encountered,
 * otherwise issues a COMMIT.
 *
 * @param {function(import('sqlite3').Database): Promise<any>} callback - Code to run inside transaction block.
 * @returns {Promise<any>} Resolves to callback results on success.
 */
const executeTransaction = async (callback) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION", async (err) => {
        if (err) return reject(err);
        try {
          const result = await callback(db);
          db.run("COMMIT", (errCommit) => {
            if (errCommit) {
              db.run("ROLLBACK");
              reject(errCommit);
            } else {
              resolve(result);
            }
          });
        } catch (error) {
          db.run("ROLLBACK");
          reject(error);
        }
      });
    });
  });
};

module.exports = {
  executeTransaction
};
