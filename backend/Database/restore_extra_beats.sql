BEGIN;
-- Insert additional beats (safe: INSERT OR IGNORE)
INSERT OR IGNORE INTO beats (id, public_id, beat_name, slug, genre, audio_key, status, price, duration, track_type, created_at, updated_at) VALUES
(2, 'b4af6389-11c5-4d76-90dc-000000000002', 'Sunset Boulevard', 'sunset-boulevard', 'Trap', NULL, 'published', 99.99, 200, 'non-exclusive', datetime('now'), datetime('now')),
(3, 'b4af6389-11c5-4d76-90dc-000000000003', 'Beat C', 'beat-c', 'Pop', NULL, 'published', 50.00, 180, 'non-exclusive', datetime('now'), datetime('now')),
(4, 'b4af6389-11c5-4d76-90dc-000000000004', 'Beat D', 'beat-d', 'R&B', NULL, 'published', 40.00, 170, 'non-exclusive', datetime('now'), datetime('now')),
(10, 'b4af6389-11c5-4d76-90dc-000000000010', 'Beat Ten', 'beat-ten', 'Trap', NULL, 'published', 99.99, 200, 'non-exclusive', datetime('now'), datetime('now')),
(11, 'b4af6389-11c5-4d76-90dc-000000000011', 'Beat Eleven', 'beat-eleven', 'Pop', NULL, 'published', 50.00, 180, 'non-exclusive', datetime('now'), datetime('now')),
(12, 'b4af6389-11c5-4d76-90dc-000000000012', 'Beat Twelve', 'beat-twelve', 'Pop', NULL, 'published', 40.00, 170, 'non-exclusive', datetime('now'), datetime('now')),
(1001, 'b4af6389-11c5-4d76-90dc-000000001001', 'Beat One', 'beat-one', 'Hip Hop', NULL, 'published', 99.99, 210, 'non-exclusive', datetime('now'), datetime('now')),
(1002, 'b4af6389-11c5-4d76-90dc-000000001002', 'Beat Two', 'beat-two', 'Hip Hop', NULL, 'published', 99.99, 210, 'non-exclusive', datetime('now'), datetime('now'));
COMMIT;
