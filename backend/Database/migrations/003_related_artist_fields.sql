-- =========================================================================
-- MIGRATION 003: RELATED ARTIST FIELDS ON BEATS
-- =========================================================================

ALTER TABLE beats ADD COLUMN related_artist_name TEXT;
ALTER TABLE beats ADD COLUMN related_artist_image_key TEXT;