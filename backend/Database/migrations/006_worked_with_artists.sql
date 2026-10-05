-- =========================================================================
-- MIGRATION 006: ARTISTS I HAVE WORKED WITH
-- =========================================================================

CREATE TABLE IF NOT EXISTS worked_with_artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    image TEXT NOT NULL
);

INSERT OR IGNORE INTO worked_with_artists (name, image)
VALUES
    ('Karan Aujla', '/karan.png'),
    ('Sidhu Moose Wala', '/siddhu.png'),
    ('Ap Dhillon', '/ap.png'),
    ('Diljit Dosanjh', '/karan.png'),
    ('Shubh', '/siddhu.png');