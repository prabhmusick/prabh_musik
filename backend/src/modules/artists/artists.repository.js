const { db } = require("../../config/db");
const { ulid } = require("ulid");

const list = async () => {
  const result = await db
    .prepare(
      `
    SELECT a.public_id, a.name, a.phone, a.email, a.image_key,
           a.created_at, COUNT(b.id) AS beat_count
    FROM artists a
    LEFT JOIN beats b ON b.artist_id = a.id
    GROUP BY a.id
    ORDER BY a.name COLLATE NOCASE ASC
  `,
    )
    .all();
  return result.results || result;
};

const findByPublicId = async (publicId) =>
  db
    .prepare(
      "SELECT id, public_id, name, phone, email, image_key FROM artists WHERE public_id = ?",
    )
    .bind(publicId)
    .first();

const create = async ({ name, phone, email, image_key }) => {
  const publicId = `art_${ulid()}`;
  await db
    .prepare(
      `
    INSERT INTO artists (public_id, name, phone, email, image_key)
    VALUES (?, ?, ?, ?, ?)
  `,
    )
    .bind(publicId, name, phone, email, image_key)
    .run();
  return findByPublicId(publicId);
};

module.exports = { list, findByPublicId, create };
