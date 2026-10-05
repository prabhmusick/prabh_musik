# Prabh Musik Master Agent Directory

Welcome! This document provides all the context, rules, patterns, and state tracking you need to pair program or build on the **Prabh Musik** repository from scratch.

---

## 1. Project Overview & Architecture

Prabh Musik is a high-performance beat marketplace consisting of a Next.js frontend catalog and a secure, production-grade Express backend utilizing Cloudflare D1 (SQL-based database) and Cloudflare R2 (object storage).

```text
                                  [ NEXT.JS FRONTEND ]
                                           │ (HTTP Requests)
                                           ▼
                                   [ EXPRESS ROUTER ]
                                           │
                                           ▼
                                 [ EXPRESS CONTROLLERS ]
                                           │
                                           ▼
                                   [ SERVICE LAYER ]
                                           │
                                           ▼
                                 [ REPOSITORY LAYER ]
                                           │
                                           ▼
                              [ CLOUDFLARE D1 ADAPTER ]
                                           │
                                           ▼
                              [ CLOUDFLARE D1 DATABASE ]
```

---

## 2. Core Coding Conventions & Layer Boundaries

We strictly enforce a **layered, decoupled backend architecture**. Each layer has distinct responsibilities:

### A. Routing Layer (`*.routes.js`)
* **Responsibility**: Map HTTP verbs and paths to controllers and mount middleware.
* **Ordering Rule**: Specific paths **MUST** be declared before parameterized paths to prevent route hijacking in Express.
  * *Correct*: `router.get("/admin", ...)` and `router.get("/slug/:slug", ...)` registered **before** `router.get("/:publicId", ...)`.
* **Constraint**: Zero business validation, zero data access, and zero response building.

### B. Controller Layer (`*.controller.js`)
* **Responsibility**: Act as the HTTP transport adapter. Extract inputs from `req.body`, `req.query`, `req.params`, and authenticated user attributes from `req.user.id`. Map service results to HTTP status codes (`201 Created` for creations, `200 OK` for reads/updates).
* **Constraint**: Thin adapters only.
* **Error Handling**: **MUST** wrap all code in a `try-catch` block and delegate errors via `next(error)` to the global error middleware. Never construct custom error JSONs inside controllers.
* **Parameter Security**: Whitelist query parameters explicitly before passing options to services to avoid query parameter pollution.

### C. Service Layer (`*.service.js`)
* **Responsibility**: Orchestrates the domain model and contains all business rules:
  1. Enforces data constraints and invariants (e.g. status transition limits, price checks).
  2. Generates ULID public identifiers (`bt_<ULID>`, `usr_<ULID>`) using the `ulid` utility.
  3. Generates unique SEO URL-safe slugs and handles collisions sequentially (`-2`, `-3`).
  4. Resolves Cloudflare R2 storage keys into absolute public HTTPS URLs using `process.env.R2_PUBLIC_URL`.
  5. Maps database rows to public-facing API DTOs (redacting internal primary `id`s, `created_by`, and raw file keys).
* **Constraint**: Protocol-agnostic (never access Express `req` or `res` objects).

### D. Repository Layer (`*.repository.js`)
* **Responsibility**: Pure data persistence. Constructs and executes SQL statements against the Cloudflare D1 interface.
* **Security & Whitelists**: Positional parameter binding is used for all values to block SQL Injection. Dynamic operations (like `sortBy` and partial updates) are checked against internal arrays of whitelisted columns.
* **Constraint**: Persistence only. No identifier generation, no business validation, no R2 URL resolving, and no DTO transformations.

---

## 3. Database & Financial Standards

* **Forward-Only Migrations**: Schema changes must be added in new sequential migration files under `backend/Database/migrations/`. Never edit an executed migration. Never write `DROP TABLE` statements in migrations to protect production data.
* **Minor Currency Units**: To prevent floating-point rounding errors, all prices are stored in minor units as integers (`INTEGER` paisa/cents). For example, ₹149.99 is stored as `14999`.

---

## 4. Current Domain Module States

### A. Users Module
* **Status**: Completed & Verified.
* **Features**: Implements user creation (`createUser`) during signup.

### B. Beats Module (Version 1.0 - Frozen)
* **Status**: 100% Completed, Verified, and Frozen.
* **Files**:
  * [Repository](file:///c:/Users/sutha/Prabh%20Musik-Frontend/prabh_musik/backend/src/modules/beats/beats.repository.js): Supports `createBeat`, `findByPublicId`, `findBySlug`, `existsBySlug`, `listBeats`, `updateBeat`, and `updateStatus`.
  * [Service](file:///c:/Users/sutha/Prabh%20Musik-Frontend/prabh_musik/backend/src/modules/beats/beats.service.js): Implements `createBeat`, `getBeatByPublicId`, `getBeatBySlug` (excludes unreleased drafts from storefront catalog to prevent information disclosure), `listPublicBeats` (enforces `status='published'`), `listAdminBeats`, `updateBeat` (regenerates SEO slug only when title changes), and `updateStatus` (enforces state transition rules).
  * [Controller](file:///c:/Users/sutha/Prabh%20Musik-Frontend/prabh_musik/backend/src/modules/beats/beats.controller.js) & [Routes](file:///c:/Users/sutha/Prabh%20Musik-Frontend/prabh_musik/backend/src/modules/beats/beats.routes.js): Mapped in the correct sequence. Mounted in [`app.js`](file:///c:/Users/sutha/Prabh%20Musik-Frontend/prabh_musik/backend/src/app.js) at `/api/beats`.

### C. Authentication Module
* **Status**: Service, Controller, and Repository logic is written but the router is **not yet mounted** in `app.js`.
* **Security & Session Protocol**:
  * **Short-Lived Access Tokens**: Stored as Bearer tokens in headers.
  * **HTTP-Only Cookies**: Refresh tokens are served with `HttpOnly`, `Secure`, and `SameSite=Strict` flags.
  * **Refresh Token Rotation (RTR)**: Rotating refresh tokens upon usage prevents token hijacking.
  * **Replay Attack Defense**: Replaying old refresh tokens immediately invalidates the entire session and logs a `TOKEN_REPLAY_DETECTED` audit event.
  * **State Transitions**: `forgotPassword`, `resetPassword`, and OAuth login methods (Google/Apple) are placeholders returning `501 Not Implemented`.

---

## 5. Security Protocols & Defense Strategies

1. **Storefront Leak Protection**: Storefront lookups for draft or archived items return a generic `404 Not Found` rather than `403 Forbidden` to prevent revealing the existence of unreleased beats.
2. **Timing-Safe Validation**: Session refresh tokens and credential passwords are compared using timing-safe utilities (`crypto.timingSafeEqual` and `bcrypt.compare`) to block timing analysis attacks.
3. **Database Injection Safeguards**: All raw repository variables are bound positionally. Sort parameters use strict lists of whitelisted columns (`ALLOWED_SORT_COLUMNS`) to block SQL injection inside clauses where standard bindings are not allowed.

---

## 6. Development & Testing Commands

To spin up development servers locally, run the appropriate scripts in their respective root directories:

* **Backend Dev Server**: `npm run dev` in `backend/` (starts Node process listening on port `5005`).
* **Frontend Catalog**: `npm run dev` in the root workspace.
* **Test Suite**: `npm test` runs Jest test specs.

### ⚠️ Note on Local Test Failures
Our test environment uses a custom Proxy wrapper around the database to emulate Cloudflare D1 APIs locally. The test suites `auth.service.test.js` and `auth.infrastructure.test.js` currently fail because they execute raw SQLite3 instance methods (`db.exec()`, `db.serialize()`) directly on the proxy container. To run these tests successfully, they need to be refactored to interface with the raw database connection object rather than the D1 wrapper.
