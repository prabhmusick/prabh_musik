const { db } = require("../../config/db");

const list = async () => {
  const result = await db
    .prepare(
      `
      SELECT id, name, image, rating, testimonial, professional, created_at
      FROM testimonials
      ORDER BY id ASC
    `,
    )
    .all();
  return result.results || result;
};

const create = async ({ name, image, rating, testimonial, professional }) => {
  const result = await db
    .prepare(
      `
      INSERT INTO testimonials (name, image, rating, testimonial, professional)
      VALUES (?, ?, ?, ?, ?)
    `,
    )
    .bind(name, image, rating, testimonial, professional)
    .run();

  return db
    .prepare(
      `
      SELECT id, name, image, rating, testimonial, professional, created_at
      FROM testimonials
      WHERE id = ?
    `,
    )
    .bind(result.meta?.last_row_id)
    .first();
};

const remove = async (id) =>
  db.prepare("DELETE FROM testimonials WHERE id = ?").bind(id).run();

module.exports = { list, create, remove };
