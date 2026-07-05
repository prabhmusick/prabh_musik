const { db } = require("../../config/db");

// Explicit list of columns to retrieve (never use SELECT *)
const USER_COLUMNS = `
  id,
  name,
  mobile,
  email,
  role,
  status,
  address,
  beats_buy,
  user_created_date,
  last_purchase_date,
  last_login_time
`;

const UPDATABLE_FIELDS = [
  "name",
  "mobile",
  "email",
  "password",
  "role",
  "status",
  "address",
  "beats_buy"
];

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
 * Fetches a single user record by its ID using explicit columns.
 */
const getUserById = async (id) => {
  const sql = `
    SELECT 
      ${USER_COLUMNS}
    FROM users 
    WHERE id = ?
  `;
  return get(sql, [id]);
};

/**
 * Checks if a specific email is already registered.
 */
const getUserByEmail = async (email) => {
  const sql = `
    SELECT 
      ${USER_COLUMNS}
    FROM users 
    WHERE email = ?
  `;
  return get(sql, [email]);
};

/**
 * Creates a new user record.
 */
const createUser = async (user) => {
  const sql = `
    INSERT INTO users (
      name,
      mobile,
      email,
      password,
      role,
      status,
      address,
      beats_buy
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?
    )
  `;

  const params = [
    user.name,
    user.mobile,
    user.email,
    user.password,
    user.role,
    user.status,
    user.address,
    user.beats_buy || 0
  ];

  const result = await run(sql, params);
  return result.id;
};

/**
 * Fetches all user records ordered by creation date descending
 */
const getAllUsers = async () => {
  const sql = `
    SELECT 
      ${USER_COLUMNS}
    FROM users 
    ORDER BY user_created_date DESC
  `;
  return all(sql);
};

/**
 * Updates properties of a user record dynamically
 */
const updateUser = async (id, user) => {
  const fields = [];
  const params = [];

  UPDATABLE_FIELDS.forEach((field) => {
    if (user[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(user[field]);
    }
  });

  if (fields.length === 0) {
    return false;
  }

  params.push(id);

  const sql = `
    UPDATE users
    SET 
      ${fields.join(",\n      ")}
    WHERE id = ?
  `;

  const result = await run(sql, params);
  return result.changes > 0;
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser
};
