-- =========================
-- USERS
-- =========================

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS beat_purchases;
DROP TABLE IF EXISTS beats;
DROP TABLE IF EXISTS users;
DROP INDEX IF EXISTS idx_orders_customer;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_order_items_order;
DROP INDEX IF EXISTS idx_order_items_beat;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,
    mobile TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,

    role TEXT DEFAULT 'customer',
    status TEXT DEFAULT 'active',
    address TEXT,

    beats_buy INTEGER DEFAULT 0,

    user_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_purchase_date DATETIME,
    last_login_time DATETIME
);

-- =========================
-- BEATS
-- =========================

CREATE TABLE beats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

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

-- =========================
-- PURCHASES
-- =========================

CREATE TABLE beat_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,
    beat_id INTEGER NOT NULL,

    purchase_price REAL,

    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id),

    FOREIGN KEY(beat_id)
    REFERENCES beats(id)
);

-- =========================
-- ORDERS
-- =========================
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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

-- =========================
-- ORDER ITEMS
-- =========================
CREATE TABLE IF NOT EXISTS order_items (
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

-- =========================
-- INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_beat ON order_items(beat_id);

-- =========================
-- OWNERSHIPS
-- =========================
CREATE TABLE IF NOT EXISTS ownerships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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

CREATE INDEX IF NOT EXISTS idx_ownerships_user ON ownerships(user_id);
CREATE INDEX IF NOT EXISTS idx_ownerships_beat ON ownerships(beat_id);
CREATE INDEX IF NOT EXISTS idx_ownerships_order ON ownerships(order_id);
CREATE INDEX IF NOT EXISTS idx_ownerships_status ON ownerships(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_ownership ON ownerships(user_id, beat_id, order_id);

CREATE TABLE IF NOT EXISTS download_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownership_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ownership_id) REFERENCES ownerships(id)
);
CREATE INDEX IF NOT EXISTS idx_download_tokens_val ON download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_owner ON download_tokens(ownership_id);

CREATE TABLE IF NOT EXISTS download_logs (
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
CREATE INDEX IF NOT EXISTS idx_download_logs_ownership ON download_logs(ownership_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_date ON download_logs(downloaded_at);