-- ==========================================
-- SEED DATA
-- ==========================================

-- Seed Users
INSERT INTO users (id, public_id, email, name, mobile, address, role, status, email_verified)
VALUES
(
    1,
    '550e8400-e29b-41d4-a716-446655440000',
    'sanskar@gmail.com',
    'Sanskar Sharma',
    '+919999999999',
    'Gurgaon, India',
    'admin',
    'active',
    1
),
(
    2,
    '550e8400-e29b-41d4-a716-446655440001',
    'amit@gmail.com',
    'Amit Garg',
    '+918888888888',
    'Delhi, India',
    'customer',
    'active',
    1
);

-- Seed Credentials (password is bcrypt hash of 'password')
INSERT INTO user_credentials (user_id, provider, password_hash)
VALUES
(
    1,
    'email',
    '$2b$10$eImiTXuWVxfM37uY4bESoO2kh.1G5dUX3B0M/YdGg3YmCjY6rJ/mG'
),
(
    2,
    'email',
    '$2b$10$eImiTXuWVxfM37uY4bESoO2kh.1G5dUX3B0M/YdGg3YmCjY6rJ/mG'
);

-- Seed Beats (with generated public_id)
INSERT INTO beats (id, public_id, title, slug, genre, audio_key, status, price_amount, duration, created_by)
VALUES 
(
    1,
    'bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y1',
    'The Mountain Storytelling',
    'the-mountain-storytelling',
    'Storytelling',
    '1780414576089-the_mountain-storytelling-audio-136105.mp3',
    'published',
    14900,
    180,
    1
),
(
    2,
    'bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y2',
    'Intensity',
    'intensity-by-audio-club',
    'Cinematic',
    '1780413092408-intensity-by-audio-club-intensity-by-audio-club-343637.mp3',
    'published',
    19900,
    210,
    1
),
(
    3,
    'bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y3',
    'Funk & Breakbeat',
    'funk-breakbeat',
    'Funk',
    '1781353812166-alexguz-funk-amp-breakbeat-541097.mp3',
    'published',
    9900,
    150,
    1
),
(
    4,
    'bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y4',
    'Water Afro Pop',
    'water-afro-pop',
    'Afrobeat',
    '1781623228264-kontraa-water-afro-pop-music-445661.mp3',
    'published',
    12900,
    165,
    1
),
(
    5,
    'bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5',
    'Nai Dabde',
    'nai-dabde',
    'Punjabi',
    '1781676259297-Nai_Dabde_-_DjPunjab.mp3',
    'published',
    14900,
    220,
    1
);