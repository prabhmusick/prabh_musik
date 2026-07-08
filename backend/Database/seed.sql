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
INSERT INTO beats (id, public_id, beat_name, slug, genre, audio_key, status, price, duration, track_type)
VALUES (
    1,
    'b4af6389-11c5-4d76-90dc-2a8d11624021',
    'The Mountain Storytelling',
    'the-mountain-storytelling',
    'Storytelling',
    '1780414576089-the_mountain-storytelling-audio-136105.mp3',
    'published',
    149.99,
    180,
    'exclusive'
);