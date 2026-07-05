const { db } = require("../../config/db");

// Explicit list of columns to retrieve (never use SELECT *)
const ORDER_COLUMNS = `
  o.id,
  o.customer_id,
  o.total_amount,
  o.payment_method,
  o.status,
  o.fulfilled_at,
  o.fulfillment_status,
  o.created_at,
  o.updated_at,
  u.name AS customer_name,
  u.email AS customer_email
`;

const ORDER_ITEM_COLUMNS = `
  oi.id,
  oi.order_id,
  oi.beat_id,
  oi.beat_title,
  oi.price,
  oi.license_type
`;

// Promise wrappers
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * Creates a new order along with its order items in a transaction.
 */
const createOrder = async (customerId, totalAmount, paymentMethod, status, items, extra = {}) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) return reject(err);

        const orderSql = `
          INSERT INTO orders (
            customer_id,
            total_amount,
            payment_method,
            payment_reference,
            transaction_id,
            gateway,
            status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(
          orderSql,
          [
            customerId,
            totalAmount,
            paymentMethod,
            extra.paymentReference || null,
            extra.transactionId || null,
            extra.gateway || null,
            status
          ],
          function (err2) {
            if (err2) {
              db.run("ROLLBACK");
              return reject(err2);
            }
            const orderId = this.lastID;

          const itemSql = `
            INSERT INTO order_items (
              order_id,
              beat_id,
              beat_title,
              price,
              license_type
            ) VALUES (?, ?, ?, ?, ?)
          `;

          let insertCount = 0;
          if (items.length === 0) {
            db.run("COMMIT", (errCommit) => {
              if (errCommit) {
                db.run("ROLLBACK");
                return reject(errCommit);
              }
              resolve(orderId);
            });
            return;
          }

          let failed = false;
          items.forEach((item) => {
            if (failed) return;
            db.run(
              itemSql,
              [orderId, item.beatId, item.beatTitle, item.price, item.licenseType || "exclusive"],
              (err3) => {
                if (err3) {
                  failed = true;
                  db.run("ROLLBACK");
                  return reject(err3);
                }
                insertCount++;
                if (insertCount === items.length) {
                  db.run("COMMIT", (errCommit) => {
                    if (errCommit) {
                      db.run("ROLLBACK");
                      return reject(errCommit);
                    }
                    resolve(orderId);
                  });
                }
              }
            );
          });
        });
      });
    });
  });
};

/**
 * Fetches an order record by ID
 */
const getOrderById = async (id) => {
  const sql = `
    SELECT 
      ${ORDER_COLUMNS}
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    WHERE o.id = ?
      AND o.is_deleted = 0
  `;
  return get(sql, [id]);
};

/**
 * Fetches order items by order ID
 */
const getOrderItems = async (orderId) => {
  const sql = `
    SELECT 
      ${ORDER_ITEM_COLUMNS}
    FROM order_items oi
    WHERE oi.order_id = ?
  `;
  return all(sql, [orderId]);
};

/**
 * Fetches all order records (excluding cancelled/soft-deleted ones)
 */
const getAllOrders = async () => {
  const sql = `
    SELECT 
      ${ORDER_COLUMNS}
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    WHERE o.is_deleted = 0
    ORDER BY o.created_at DESC
  `;
  return all(sql);
};

/**
 * Updates properties of an order record dynamically
 */
const updateOrder = async (id, order) => {
  const fields = [];
  const params = [];
  const UPDATABLE_FIELDS = ["payment_method", "status"];

  UPDATABLE_FIELDS.forEach((field) => {
    if (order[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(order[field]);
    }
  });

  if (fields.length === 0) {
    return false;
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const sql = `
    UPDATE orders
    SET 
      ${fields.join(",\n      ")}
    WHERE id = ?
  `;

  const result = await run(sql, params);
  return result.changes > 0;
};

/**
 * Updates order status specifically
 */
const updateOrderStatus = async (id, status) => {
  const sql = `
    UPDATE orders
    SET 
      status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const result = await run(sql, [status, id]);
  return result.changes > 0;
};

/**
 * Soft deletes an order by flagging is_deleted
 */
const deleteOrder = async (id) => {
  const sql = `
    UPDATE orders
    SET 
      is_deleted = 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const result = await run(sql, [id]);
  return result.changes > 0;
};

let transactionMutex = Promise.resolve();

/**
 * executeFulfillmentTransaction owns the transaction lifecycle only.
 * It must not contain business rules. All validation, orchestration,
 * and decision making remain in the service layer.
 */
const executeFulfillmentTransaction = async (orderId, callback) => {
  const runTransaction = () => {
    return new Promise((resolve, reject) => {
      let callbackResult = null;
      const context = { lockAcquired: false };
      db.serialize(() => {
        db.run("BEGIN TRANSACTION", async (err) => {
          if (err) return reject(err);
          try {
            callbackResult = await callback(db, context);
            db.run("COMMIT", (errCommit) => {
              if (errCommit) {
                db.run("ROLLBACK");
                return reject(errCommit);
              }
              resolve(callbackResult);
            });
          } catch (error) {
            db.run("ROLLBACK");
            // Rollback failed state update ONLY if processing lock was successfully acquired
            if (context.lockAcquired) {
              db.run(
                "UPDATE orders SET fulfillment_status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [orderId]
              );
            }
            reject(error);
          }
        });
      });
    });
  };

  const nextMutex = transactionMutex.then(runTransaction);
  transactionMutex = nextMutex.catch(() => {});
  return nextMutex;
};

/**
 * Transactional lock update helper
 */
const acquireFulfillmentLock = async (orderId, tx) => {
  const sql = `
    UPDATE orders 
    SET 
      fulfillment_status = 'processing',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND fulfillment_status = 'pending'
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [orderId], function (err) {
      if (err) reject(err);
      else resolve(this.changes > 0);
    });
  });
};

/**
 * Transactional completion update helper
 */
const completeFulfillment = async (orderId, tx) => {
  const sql = `
    UPDATE orders 
    SET 
      fulfillment_status = 'completed',
      fulfilled_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  return new Promise((resolve, reject) => {
    tx.run(sql, [orderId], function (err) {
      if (err) reject(err);
      else resolve(this.changes > 0);
    });
  });
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderItems,
  getAllOrders,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  executeFulfillmentTransaction,
  acquireFulfillmentLock,
  completeFulfillment
};
