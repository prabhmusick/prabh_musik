-- =========================================================================
-- MIGRATION 001: INITIAL SCHEMA (USERS & BEATS)
-- =========================================================================
-- MIGRATION PHILOSOPHY:
--   1. Forward-Only: This script is cumulative and immutable. Once executed, it
--      must never be edited.
--   2. No DROPs: We do not drop tables in migrations to protect production data.
--   3. Single Capability: This migration handles core user profiles and catalog.
--
-- LAYER CONVENTIONS & RESPONSIBILITIES:
--   - Repository Layer: The only layer executing SQL. Responsible for manual
--     updates of updated_at = CURRENT_TIMESTAMP on updates. No triggers are used.
--   - Service Layer: Coordinates transactions, handles R2, and generates
--     ULID-prefixed public IDs (usr_<ULID> and bt_<ULID>).
--   - Controller Layer: Handles HTTP parsing and standards. Never contains SQL.
--
-- R2 STORAGE DIRECTORIES:
--   - audio/bt_<public_id>.mp3
--   - covers/bt_<public_id>_<timestamp>.webp
--   - banners/bt_<public_id>_<timestamp>.webp
--   - avatars/usr_<public_id>_<timestamp>.webp
-- =========================================================================

-- 1. User Profiles Table
-- Contains profile identity and application state (Auth deferred to Migration 003)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT UNIQUE NOT NULL,            -- Pattern: usr_<ULID> (Exposed to frontend)
    email TEXT UNIQUE NOT NULL,                -- Normalized to lowercase by Service Layer
    name TEXT NOT NULL,
    mobile TEXT,
    avatar_key TEXT,                           -- Pattern: avatars/usr_<public_id>_<timestamp>.webp
    
    -- Status Fields (Enforced via Application Validation Layer)
    -- Role Allowed: 'customer', 'admin'
    role TEXT NOT NULL DEFAULT 'customer',
    -- Status Allowed: 'active', 'suspended'
    status TEXT NOT NULL DEFAULT 'active',
    
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Beat Catalog Table
-- Stores metadata, price in minor currency units (cents/paisa), and R2 pointers
CREATE TABLE beats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT UNIQUE NOT NULL,            -- Pattern: bt_<ULID> (Exposed to frontend)
    title TEXT NOT NULL,                        -- Renamed from beat_name
    slug TEXT UNIQUE NOT NULL,                  -- SEO Url-safe representation (e.g. 'midnight-drive')
    
    -- Financials: Stored in minor currency units (e.g. 14999 = ₹149.99)
    -- Deferring to license tables in future migrations
    price_amount INTEGER NOT NULL DEFAULT 0,
    currency_code TEXT NOT NULL DEFAULT 'INR', -- ISO-4217 Currency representation
    
    genre TEXT,
    bpm INTEGER,
    musical_key TEXT,                          -- Catalog metadata (e.g. 'Cmin', 'Amaj')
    description TEXT,
    
    -- Object Storage Pointers
    audio_key TEXT NOT NULL,                   -- Pattern: audio/bt_<public_id>.mp3
    cover_key TEXT,                            -- Pattern: covers/bt_<public_id>_<timestamp>.webp
    banner_key TEXT,                           -- Pattern: banners/bt_<public_id>_<timestamp>.webp
    
    duration INTEGER,                          -- Length in seconds
    
    -- Workflow Status Allowed: 'draft', 'published', 'archived'
    status TEXT NOT NULL DEFAULT 'draft',
    
    created_by INTEGER NOT NULL,               -- Foreign key referencing users.id
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 3. Core Database Indexes
CREATE INDEX idx_users_public_id ON users(public_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_beats_public_id ON beats(public_id);
CREATE INDEX idx_beats_slug ON beats(slug);
CREATE INDEX idx_beats_status ON beats(status);
CREATE INDEX idx_beats_genre ON beats(genre);
CREATE INDEX idx_beats_created_by ON beats(created_by);
