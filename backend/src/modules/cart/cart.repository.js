const { db } = require("../../config/db");
const RepositoryError = require("../../errors/RepositoryError");

const findUserId = async (publicId) => {
  const row = await db
    .prepare("SELECT id FROM users WHERE public_id = ?")
    .bind(publicId)
    .first();
  if (!row) throw new RepositoryError("User not found");
  return row.id;
};

const list = async (userPublicId) => {
  const userId = await findUserId(userPublicId);
  const result = await db
    .prepare(
      `
    SELECT b.public_id, b.title, b.price_amount, b.genre, b.bpm, b.audio_key, b.cover_key
    FROM cart_items c
    JOIN beats b ON b.id = c.beat_id
    WHERE c.user_id = ? AND b.status = 'published'
    ORDER BY c.added_at ASC
  `,
    )
    .bind(userId)
    .all();
  return result.results || [];
};

const replace = async (userPublicId, beatIds) => {
  const userId = await findUserId(userPublicId);
  const statements = [
    db.prepare("DELETE FROM cart_items WHERE user_id = ?").bind(userId),
    ...beatIds.map((beatId) =>
      db
        .prepare(
          `
      INSERT OR IGNORE INTO cart_items (user_id, beat_id)
      SELECT ?, id FROM beats WHERE public_id = ? AND status = 'published'
    `,
        )
        .bind(userId, beatId),
    ),
  ];
  await db.batch(statements);
  return list(userPublicId);
};

const remove = async (userPublicId, beatId) => {
  const userId = await findUserId(userPublicId);
  await db
    .prepare(
      `
    DELETE FROM cart_items
    WHERE user_id = ? AND beat_id = (SELECT id FROM beats WHERE public_id = ?)
  `,
    )
    .bind(userId, beatId)
    .run();
  return list(userPublicId);
};

module.exports = { list, replace, remove };
