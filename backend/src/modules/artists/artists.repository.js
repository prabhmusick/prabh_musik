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
          show_on_music_production, show_on_mix_master, show_on_lyrics,
          show_on_marketing_distribution
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
  showOnMixMaster,
  showOnLyrics,
  showOnMarketingDistribution,
}) => {
  const result = await db
    .prepare(
      `
      INSERT INTO worked_with_artists
        (name, image, popular_song, music_type, worked_year, show_on_music_production,
          show_on_mix_master, show_on_lyrics, show_on_marketing_distribution)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .bind(
      name,
      image,
      popularSong,
      musicType,
      workedYear,
      showOnMusicProduction ? 1 : 0,
      showOnMixMaster ? 1 : 0,
      showOnLyrics ? 1 : 0,
      showOnMarketingDistribution ? 1 : 0,
    )
    .run();

  return db
    .prepare(
      "SELECT id, name, image, popular_song, music_type, worked_year, show_on_music_production, show_on_mix_master, show_on_lyrics, show_on_marketing_distribution FROM worked_with_artists WHERE id = ?",
    )
    .bind(result.meta?.last_row_id)
    .first();
};

const deleteWorkedWith = async (id) =>
  db.prepare("DELETE FROM worked_with_artists WHERE id = ?").bind(id).run();

const updateWorkedWithVisibility = async (id, visibility) =>
  db
    .prepare(
      `UPDATE worked_with_artists
     SET show_on_music_production = ?, show_on_mix_master = ?, show_on_lyrics = ?,
         show_on_marketing_distribution = ?
     WHERE id = ?`,
    )
    .bind(
      visibility.showOnMusicProduction ? 1 : 0,
      visibility.showOnMixMaster ? 1 : 0,
      visibility.showOnLyrics ? 1 : 0,
      visibility.showOnMarketingDistribution ? 1 : 0,
      id,
    )
    .run();

const findWorkedWithById = async (id) =>
  db
    .prepare(
      `SELECT id, name, image, popular_song, music_type, worked_year,
        show_on_music_production, show_on_mix_master, show_on_lyrics,
        show_on_marketing_distribution
       FROM worked_with_artists WHERE id = ?`,
    )
    .bind(id)
    .first();

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
  updateWorkedWithVisibility,
  findWorkedWithById,
  findByPublicId,
  create,
};
