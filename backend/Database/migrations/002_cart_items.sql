-- =========================================================================
-- MIGRATION 002: PERSISTED USER CARTS
-- =========================================================================

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    beat_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(beat_id) REFERENCES beats(id) ON DELETE CASCADE,
    UNIQUE(user_id, beat_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_beat_purchases_user ON beat_purchases(user_id);
