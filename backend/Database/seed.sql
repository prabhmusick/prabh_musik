-- Users
-- Seed users (passwords are plain-text placeholders; change in production)
INSERT INTO users (name, email, mobile, password, address)
VALUES
(
    'Sanskar Sharma',
    'sanskar@gmail.com',
    '+919999999999',
    'password',
    'Gurgaon, India'
),
(
    'Amit Garg',
    'amit@gmail.com',
    '+918888888888',
    'password',
    'Delhi, India'
);

-- Seed a beat (using R2 key naming conventions instead of absolute URLs, providing unique slugs)
INSERT INTO beats (beat_name, slug, genre, audio_key, status, price, duration, track_type)
VALUES (
    'The Mountain Storytelling',
    'the-mountain-storytelling',
    'Storytelling',
    '1780414576089-the_mountain-storytelling-audio-136105.mp3',
    'published',
    149.99,
    180,
    'exclusive'
);