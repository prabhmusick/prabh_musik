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

const listWorkedWith = async () => {
  const result = await db
    .prepare(
      `
        SELECT id, name, image, popular_song, music_type, worked_year,
          show_on_music_production
    FROM worked_with_artists
    ORDER BY id ASC
  `,
    )
    .all();
  return result.results || result;
};

const createWorkedWith = async ({
  name,
  image,
  popularSong,
  musicType,
  workedYear,
  showOnMusicProduction,
}) => {
  const result = await db
    .prepare(
      `
      INSERT INTO worked_with_artists
        (name, image, popular_song, music_type, worked_year, show_on_music_production)
      VALUES (?, ?, ?, ?, ?, ?)
  `,
    )
    .bind(
      name,
      image,
      popularSong,
      musicType,
      workedYear,
      showOnMusicProduction ? 1 : 0,
    )
    .run();

  return db
    .prepare(
      "SELECT id, name, image, popular_song, music_type, worked_year, show_on_music_production FROM worked_with_artists WHERE id = ?",
    )
    .bind(result.meta?.last_row_id)
    .first();
};

const deleteWorkedWith = async (id) =>
  db.prepare("DELETE FROM worked_with_artists WHERE id = ?").bind(id).run();

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

module.exports = {
  list,
  listWorkedWith,
  createWorkedWith,
  deleteWorkedWith,
  findByPublicId,
  create,
};
