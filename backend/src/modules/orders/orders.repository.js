const { db } = require("../../config/db");
const crypto = require("crypto");
const RepositoryError = require("../../errors/RepositoryError");

const { executeAtomicBatch, executeTransaction } = require("../../config/transaction");
// Explicit list of columns to retrieve (never use SELECT *)
const ORDER_COLUMNS = `
  o.id,
  o.public_id,
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
        reject(new RepositoryError(`Database run error: ${err.message}`, err));
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
        reject(new RepositoryError(`Database get error: ${err.message}`, err));
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
        reject(new RepositoryError(`Database all error: ${err.message}`, err));
      } else {
        resolve(rows);
      }
    });
  });
};

const createOrder = async (
  customerId,
  totalAmount,
  paymentMethod,
  status,
  items,
  extra = {},
) => {
  const publicId = crypto.randomUUID();
  // Build statements for atomic batch
  const statements = [];

  // Insert order
  const orderStmt = db.prepare(`
    INSERT INTO orders (
      public_id,
      customer_id,
      total_amount,
      payment_method,
      payment_reference,
      transaction_id,
      gateway,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    publicId,
    customerId,
    totalAmount,
    paymentMethod,
    extra.paymentReference || null,
    extra.transactionId || null,
    extra.gateway || null,
    status,
  );
  statements.push(orderStmt);

  // Insert order items using subquery for order_id via public_id
  const itemSql = `
    INSERT INTO order_items (
      order_id,
      beat_id,
      beat_title,
      price,
      license_type
    ) VALUES ((SELECT id FROM orders WHERE public_id = ?), ?, ?, ?, ?)
  `;
  items.forEach((item) => {
    const stmt = db.prepare(itemSql).bind(
      publicId,
      item.beatId,
      item.beatTitle,
      item.price,
      item.licenseType || "exclusive",
    );
    statements.push(stmt);
  });

  // Insert beat purchases if order is paid
  if (status === "paid") {
    const purchaseSql = `
      INSERT INTO beat_purchases (user_id, beat_id, purchase_price)
      SELECT ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM beat_purchases WHERE user_id = ? AND beat_id = ?
      )
    `;
    items.forEach((item) => {
      const stmt = db.prepare(purchaseSql).bind(
        customerId,
        item.beatId,
        item.price,
        customerId,
        item.beatId,
      );
      statements.push(stmt);
    });
  }

  // Execute batch atomically and return the generated order id
  return executeAtomicBatch(statements)
    .then(async () => {
      const row = await db.prepare(`SELECT id FROM orders WHERE public_id = ?`).bind(publicId).first();
      return row.id;
    })
    .catch((err) => {
      throw new RepositoryError(`Failed to create order transaction: ${err.message}`, err);
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

/**
 * Hard deletes an order and its associated items/purchases/ownerships (used for transactional rollback on fulfillment crash).
 */
const deleteOrderCompletely = async (id) => {
  try {
    await run(`DELETE FROM ownerships WHERE order_id = ?`, [id]);
    await run(`DELETE FROM order_items WHERE order_id = ?`, [id]);
    await run(`DELETE FROM beat_purchases WHERE user_id = (SELECT customer_id FROM orders WHERE id = ?) AND beat_id IN (SELECT beat_id FROM order_items WHERE order_id = ?)`, [id, id]);
    const result = await run(`DELETE FROM orders WHERE id = ?`, [id]);
    return result.changes > 0;
  } catch (err) {
    return false;
  }
};

let transactionMutex = Promise.resolve();

/**
 * executeFulfillmentTransaction owns the transaction lifecycle only.
 * It must not contain business rules. All validation, orchestration,
 * and decision making remain in the service layer.
 */
const executeFulfillmentTransaction = async (orderId, callback) => {
  const context = { lockAcquired: false };
  return executeTransaction(async (tx) => {
    try {
      const result = await callback(tx, context);
      return result;
    } catch (error) {
      if (context.lockAcquired) {
        try {
          await run(
            `UPDATE orders SET fulfillment_status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [orderId],
          );
        } catch (_) {}
      }
      throw error;
    }
  });
};

/**
 * Transactional lock update helper.
 * Atomically transitions order fulfillment_status from 'pending' to 'processing'.
 * Preserves strict atomic conditional update semantics and returns true if and
 * only if the conditional update affected the pending row.
 *
 * @param {number|string} orderId - Internal order ID.
 * @param {object} [tx] - Optional transaction handle (for interface compatibility).
 * @returns {Promise<boolean>} Resolves to true if lock was acquired, false otherwise.
 */
const acquireFulfillmentLock = async (orderId, tx = null) => {
  const sql = `
    UPDATE orders
    SET fulfillment_status = 'processing',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND fulfillment_status = 'pending'
  `;
  const result = await run(sql, [orderId]);
  return result.changes > 0;
};

/**
 * Transactional completion update helper
 */
const completeFulfillment = async (orderId, tx = null) => {
  const sql = `
    UPDATE orders
    SET fulfillment_status = 'completed',
        fulfilled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  if (tx && typeof tx.run === "function") {
    tx.run(sql, [orderId], () => {});
    return true;
  }
  const result = await run(sql, [orderId]);
  return result.changes > 0;
};

/**
 * Finds a single order record matching a payment reference (Stripe paymentIntentId).
 *
 * @param {string} paymentReference - The unique payment intent reference.
 * @returns {Promise<Object|null>} The order profile object, or null.
 */
const getOrderByPaymentReference = async (paymentReference) => {
  const sql = `
    SELECT 
      ${ORDER_COLUMNS}
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    WHERE o.payment_reference = ?
      AND o.is_deleted = 0
    LIMIT 1
  `;
  try {
    const order = await db.prepare(sql).bind(paymentReference).first();
    return order || null;
  } catch (err) {
    if (err instanceof RepositoryError) {
      throw err;
    }
    throw new RepositoryError(
      `Failed to fetch order by payment reference: ${err.message}`,
      err,
    );
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderItems,
  getAllOrders,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  deleteOrderCompletely,
  executeFulfillmentTransaction,
  acquireFulfillmentLock,
  completeFulfillment,
  getOrderByPaymentReference,
};
