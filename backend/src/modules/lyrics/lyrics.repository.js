const { db } = require("../../config/db");

const list = async () => {
  const result = await db
    .prepare(
      `
      SELECT id, title, genre, quote, created_at
      FROM lyrics
      ORDER BY id ASC
    `,
    )
    .all();
  return result.results || result;
};

const create = async ({ title, genre, quote }) => {
  const result = await db
    .prepare(
      `
      INSERT INTO lyrics (title, genre, quote)
      VALUES (?, ?, ?)
    `,
    )
    .bind(title, genre, quote)
    .run();

  return db
    .prepare(
      "SELECT id, title, genre, quote, created_at FROM lyrics WHERE id = ?",
    )
    .bind(result.meta?.last_row_id)
    .first();
};

const remove = async (id) =>
  db.prepare("DELETE FROM lyrics WHERE id = ?").bind(id).run();

module.exports = { list, create, remove };
