-- =========================================================================
-- MIGRATION 004: TRENDING BEAT RANKING
-- =========================================================================

ALTER TABLE beats ADD COLUMN play_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE beats ADD COLUMN is_trending INTEGER NOT NULL DEFAULT 0 CHECK(is_trending IN (0, 1));