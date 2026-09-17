-- =========================================================================
-- MIGRATION 005: ARTISTS AND BEAT ARTIST RELATION
-- =========================================================================

CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    image_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE beats ADD COLUMN artist_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_beats_artist_id ON beats(artist_id);
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
