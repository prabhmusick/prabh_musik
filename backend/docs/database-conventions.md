# Prabh Musik Backend & Database Conventions

This document serves as the official design standard and architectural source of truth for the Prabh Musik backend. Every engineer on the team must adhere strictly to these patterns to prevent technical debt, ensure Cloudflare D1/R2 compatibility, and maintain audit integrity.

---

## 1. Architectural Layers & Responsibilities

The backend is built around a strict separation of concerns, employing the Repository & Service Pattern.

### Controller Layer
* **Responsibilities**: Handles HTTP requests, parses headers/parameters/bodies, returns standardized JSON responses, and delegates work to the Service layer.
* **Rules**:
  * Must **never** query the database or invoke SQL commands.
  * Must **never** contain core business rules.
  * Only contains routing, request validation schemas (Zod/Joi), and response payload mapping.

### Service Layer
* **Responsibilities**: Orchestrates business rules, security/permissions, public identifier generation, and coordinates integrations (like Cloudflare R2 bucket transfers and payment gateways).
* **Rules**:
  * The **only** layer allowed to generate public IDs (e.g., `usr_`, `bt_`).
  * Handles time/date manipulations (e.g., preparing expiration timestamps).
  * Coordinates transactions across multiple repositories if necessary.

### Repository Layer
* **Responsibilities**: Connects directly to the database driver (Cloudflare D1 via SQL/Drizzle/Kysely). Encapsulates all query structures.
* **Rules**:
  * The **only** layer allowed to execute SQL queries.
  * Responsible for executing manual timestamp updates (e.g. binding `updated_at = CURRENT_TIMESTAMP`) on update queries.
  * Does not contain complex domain rules, only query execution, filtering, and data maps.

---

## 2. Public ID Convention

To prevent **resource enumeration attacks** and avoid exposing internal database structure (autoincrementing IDs) to the client, we use unique, lexicographically sortable strings (ULIDs) prefixed by domain identifiers.

* **Format**: `<domain>_<ULID>`
* **Rule**: Generated dynamically in the **Service Layer** on entity creation and saved to the database's `public_id` column.

| Prefix | Entity | Example |
| :--- | :--- | :--- |
| `usr_` | Users | `usr_01H7B272Y2E52G9Z5Z5B9D8Y7Z` |
| `bt_` | Beats | `bt_01H7B273Y2E52G9Z5Z5B9D8Y8A` |
| `ord_` | Orders | `ord_01H7B274Y2E52G9Z5Z5B9D8Y9B` |
| `own_` | Ownerships | `own_01H7B275Y2E52G9Z5Z5B9D8Y0C` |
| `dlt_` | Download Tokens | `dlt_01H7B276Y2E52G9Z5Z5B9D8Y1D` |
| `ses_` | User Sessions | `ses_01H7B277Y2E52G9Z5Z5B9D8Y2E` |

---

## 3. Database Migration Philosophy

* **Forward-Only**: All migration steps are cumulative and incremental. Once a migration script is committed to version control and deployed, it **must never be edited**.
* **No DROPs in Production**: Migration files must **never** include `DROP TABLE` statements. Schema teardowns are done in separate local reset routines, never inside production migration history files.
* **Single Business Capability**: Each migration file must introduce **exactly one** standalone capability (e.g., `001_initial_schema`, `002_orders`, `003_authentication`). Do not mix unrelated domain entities into the same migration.
* **Migration Naming**: Follow the three-digit prefix pattern: `001_initial_schema.sql`, `002_orders.sql`, `003_authentication.sql`, etc.

---

## 4. Money & Financial Representation

* **Format**: All financial amounts are stored as **integers representing the smallest currency unit** (e.g. paisa for INR, cents for USD).
* **Float Prevention**: `REAL` or `DOUBLE` types must **never** be used for currency. Floating-point arithmetic is banned due to precision errors.
* **Stripe/Razorpay Integration**: Storing values in cents/paisa allows us to forward `price_amount` and `currency_code` directly to payment gateways without converting them at runtime.
* **Examples**:
  * ₹999.00 is stored as `99900`.
  * ₹9.99 is stored as `999`.

---

## 5. Timestamp Strategy

We do **not** use SQLite triggers for tracking record modifications to keep database execution predictable, visible, and migration-friendly.
* The application Repository layer is responsible for explicitly appending `updated_at = CURRENT_TIMESTAMP` (or equivalent database parameter binding) to every `UPDATE` SQL command.
* Doing so keeps database transactions explicit, traceable, and prevents side effects when executing migrations or historical data backfills.

---

## 6. Cloudflare R2 Storage Convention

Actual media files are stored in Cloudflare R2. The database stores the R2 object keys rather than absolute URLs. The backend generates the signed/static URLs on demand when returning API responses.

### Key Structure
* `audio/`
* `covers/`
* `banners/`
* `avatars/`
* `contracts/`

### Filename Pattern
To ensure R2 items correspond directly to database rows and avoid collision:
* Audio: `audio/bt_<public_id>.mp3` (e.g., `audio/bt_01H7B273Y2E52.mp3`)
* Cover Artwork: `covers/bt_<public_id>_<version_timestamp>.webp`
* Banners: `banners/bt_<public_id>_<version_timestamp>.webp`
* Profile Avatars: `avatars/usr_<public_id>_<version_timestamp>.webp`
