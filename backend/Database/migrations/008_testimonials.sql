-- =========================================================================
-- MIGRATION 008: CLIENT TESTIMONIALS
-- =========================================================================

CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    testimonial TEXT NOT NULL,
    professional TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);