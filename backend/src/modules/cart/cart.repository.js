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

const findBeatIds = async (beatIds) => {
  if (!beatIds || !Array.isArray(beatIds) || beatIds.length === 0) return [];
  const resolvedIds = [];
  for (const idOrPublicId of beatIds) {
    if (!idOrPublicId) continue;
    const isNum = /^\d+$/.test(String(idOrPublicId));
    const query = isNum
      ? "SELECT id FROM beats WHERE id = ? AND status = 'published'"
      : "SELECT id FROM beats WHERE public_id = ? AND status = 'published'";
    const row = await db
      .prepare(query)
      .bind(isNum ? Number(idOrPublicId) : String(idOrPublicId))
      .first();
    if (row && row.id) {
      resolvedIds.push(row.id);
    }
  }
  return resolvedIds;
};

const list = async (userPublicId) => {
  const userId = await findUserId(userPublicId);
  const cartRows = await db
    .prepare(
      "SELECT beat_id FROM cart_items WHERE user_id = ? ORDER BY added_at ASC",
    )
    .bind(userId)
    .all();
  const items = cartRows.results || [];
  if (items.length === 0) return [];

  const beats = [];
  for (const row of items) {
    const beat = await db
      .prepare(
        "SELECT public_id, title, price_amount, genre, bpm, audio_key, cover_key, related_artist_name FROM beats WHERE id = ? AND status = 'published'",
      )
      .bind(row.beat_id)
      .first();
    if (beat) beats.push(beat);
  }
  return beats;
};

const replace = async (userPublicId, beatIds) => {
  const userId = await findUserId(userPublicId);
  const internalBeatIds = await findBeatIds(beatIds);
  const statements = [
    db.prepare("DELETE FROM cart_items WHERE user_id = ?").bind(userId),
    ...internalBeatIds.map((internalId) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO cart_items (user_id, beat_id) VALUES (?, ?)",
        )
        .bind(userId, internalId),
    ),
  ];
  await db.batch(statements);
  return list(userPublicId);
};

const remove = async (userPublicId, beatId) => {
  const userId = await findUserId(userPublicId);
  const internalBeatIds = await findBeatIds([beatId]);
  if (internalBeatIds.length > 0) {
    await db
      .prepare("DELETE FROM cart_items WHERE user_id = ? AND beat_id = ?")
      .bind(userId, internalBeatIds[0])
      .run();
  }
  return list(userPublicId);
};

module.exports = { list, replace, remove };
