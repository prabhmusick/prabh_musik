-- =========================================================================
-- MIGRATION 009: LYRICS COMMISSIONS
-- =========================================================================

CREATE TABLE IF NOT EXISTS lyrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    quote TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO lyrics (title, genre, quote)
SELECT 'Neon Soul', 'Pop · Electronic', 'Dancing through the static of a city made of glass, every heartbeat echoing the shadows that we pass—'
WHERE NOT EXISTS (SELECT 1 FROM lyrics WHERE title = 'Neon Soul');

INSERT INTO lyrics (title, genre, quote)
SELECT 'Binary Heartbeat', 'Alternative', 'In the 1s and 0s of the life we left behind, I found the only truth that I could never redefine.'
WHERE NOT EXISTS (SELECT 1 FROM lyrics WHERE title = 'Binary Heartbeat');

INSERT INTO lyrics (title, genre, quote)
SELECT 'Midnight Echo', 'R&B · Soul', 'Soft whispers in the hallway of a house we used to call home, carving names into the silence when I''m alone.'
WHERE NOT EXISTS (SELECT 1 FROM lyrics WHERE title = 'Midnight Echo');