-- =========================================================================
-- MIGRATION 008: WORKED-WITH ARTISTS MUSIC PRODUCTION VISIBILITY
-- =========================================================================

ALTER TABLE worked_with_artists
ADD COLUMN show_on_music_production INTEGER NOT NULL DEFAULT 0;

UPDATE worked_with_artists
SET show_on_music_production = 1
WHERE name IN ('Karan Aujla', 'Sidhu Moose Wala');