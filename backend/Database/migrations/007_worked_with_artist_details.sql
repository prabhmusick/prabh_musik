-- =========================================================================
-- MIGRATION 007: WORKED-WITH ARTIST DETAILS
-- =========================================================================

ALTER TABLE worked_with_artists ADD COLUMN popular_song TEXT;
ALTER TABLE worked_with_artists ADD COLUMN music_type TEXT;
ALTER TABLE worked_with_artists ADD COLUMN worked_year INTEGER;

UPDATE worked_with_artists
SET popular_song = 'Dont Look 2',
    music_type = 'Punjabi Trap',
    worked_year = 2024
WHERE popular_song IS NULL
   OR music_type IS NULL
   OR worked_year IS NULL;