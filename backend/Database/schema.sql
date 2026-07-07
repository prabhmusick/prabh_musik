-- ==========================================
-- SPRINT 2: AUTHENTICATION DATABASE LAYER
-- ==========================================

DROP TABLE IF EXISTS download_logs;
DROP TABLE IF EXISTS download_tokens;
DROP TABLE IF EXISTS ownerships;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS beat_purchases;
DROP TABLE IF EXISTS beats;
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS user_credentials;
DROP TABLE IF EXISTS users;

-- ==========================================
-- USERS & CREDENTIALS
-- ==========================================

-- customer profile and account state
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT UNIQUE NOT NULL,            -- public-facing UUID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT,                               -- profile field
    avatar_url TEXT,                           -- profile field
    role TEXT DEFAULT 'customer',              -- 'customer', 'admin'
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted')),
    address TEXT,                              -- profile field
    email_verified INTEGER DEFAULT 0 CHECK(email_verified IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
);

-- login methods and security credentials
CREATE TABLE user_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL CHECK(provider IN ('email', 'google', 'apple')),
    provider_id TEXT,                          -- oauth ID (null for email provider)
    provider_email TEXT,                       -- OAuth email returned at login for linking/debug
    password_hash TEXT,                        -- bcrypt hash (null for OAuth providers)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, provider),
    UNIQUE(provider, provider_id)
);

-- refresh token sessions
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,                       -- UUID
    user_id INTEGER NOT NULL,
    refresh_token_hash TEXT UNIQUE NOT NULL,   -- SHA-256 hash of refresh token
    device_name TEXT,
    ip TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME,
    revoked_reason TEXT,                       -- Added for Sprint 6
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- password reset lifecycle tokens
CREATE TABLE password_reset_tokens (
    id TEXT PRIMARY KEY,                       -- UUID
    user_id INTEGER NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,           -- SHA-256 hash of reset token
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- email verification lifecycle tokens
CREATE TABLE email_verification_tokens (
    id TEXT PRIMARY KEY,                       -- UUID
    user_id INTEGER NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,           -- SHA-256 hash of verification token
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- BEATS
-- ==========================================

CREATE TABLE beats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT UNIQUE NOT NULL,            -- public-facing UUID
    beat_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    beat_type TEXT,
    price REAL DEFAULT 0,
    genre TEXT,
    bpm INTEGER,
    description TEXT,
    audio_key TEXT NOT NULL,
    cover_key TEXT,
    banner_key TEXT,
    duration INTEGER,
    track_type TEXT,
    mood TEXT,
    selling_status TEXT DEFAULT 'available',
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- PURCHASES, ORDERS & ITEMS
-- ==========================================

CREATE TABLE beat_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    beat_id INTEGER NOT NULL,
    purchase_price REAL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(beat_id) REFERENCES beats(id)
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT UNIQUE NOT NULL,            -- public-facing UUID
    customer_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT,
    payment_reference TEXT,
    transaction_id TEXT,
    gateway TEXT,
    status TEXT DEFAULT 'pending',
    is_deleted INTEGER DEFAULT 0,
    fulfilled_at DATETIME,
    fulfillment_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    beat_id INTEGER NOT NULL,
    beat_title TEXT NOT NULL,
    price REAL NOT NULL,
    license_type TEXT DEFAULT 'exclusive',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(beat_id) REFERENCES beats(id)
);

-- ==========================================
-- OWNERSHIPS & DOWNLOAD LOGS
-- ==========================================

CREATE TABLE ownerships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT UNIQUE NOT NULL,            -- public-facing UUID
    user_id INTEGER NOT NULL,
    beat_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    license_type TEXT NOT NULL,
    purchase_price REAL NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER,
    expires_at DATETIME,
    status TEXT DEFAULT 'active',
    revoked_at DATETIME,
    download_token TEXT,
    last_download_at DATETIME,
    created_by_order_status TEXT DEFAULT 'paid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(beat_id) REFERENCES beats(id),
    FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE TABLE download_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownership_id INTEGER NOT NULL,
    -- TODO Future Sprint: Replace plaintext token with token_hash matching safety model of other tokens
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ownership_id) REFERENCES ownerships(id)
);

CREATE TABLE download_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownership_id INTEGER NOT NULL,
    token_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL,
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ownership_id) REFERENCES ownerships(id),
    FOREIGN KEY(token_id) REFERENCES download_tokens(id)
);

-- ==========================================
-- INDEXES
-- ==========================================

-- users table indexes
CREATE INDEX idx_users_public_id ON users(public_id);
CREATE INDEX idx_users_email ON users(email);

-- user credentials table indexes
CREATE INDEX idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_provider_id ON user_credentials(provider, provider_id);

-- session & token indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- orders, items, ownerships indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_beat ON order_items(beat_id);
CREATE INDEX idx_ownerships_user ON ownerships(user_id);
CREATE INDEX idx_ownerships_beat ON ownerships(beat_id);
CREATE INDEX idx_ownerships_order ON ownerships(order_id);
CREATE INDEX idx_ownerships_status ON ownerships(status);
CREATE UNIQUE INDEX idx_unique_ownership ON ownerships(user_id, beat_id, order_id);

-- downloads indexes
CREATE INDEX idx_download_tokens_val ON download_tokens(token);
CREATE INDEX idx_download_tokens_owner ON download_tokens(ownership_id);
CREATE INDEX idx_download_logs_ownership ON download_logs(ownership_id);
CREATE INDEX idx_download_logs_date ON download_logs(downloaded_at);