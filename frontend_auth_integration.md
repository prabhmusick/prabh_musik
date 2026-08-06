# Frontend Authentication Integration Details

This document outlines the architecture, data flows, and security guidelines for the Next.js frontend authentication layer.

---

## 1. Authentication Architecture

The authentication layer follows a strict unidirectional design:

```
[UI Components]
     │ (Triggers login/signup/logout actions)
     ▼
[AppShell Context] ◄─── (Syncs auth state: user & isAuthenticated)
     │
     ▼
[React Query (useCurrentUser)]
     │
     ▼
[Axios API Client] (Manages token headers, refresh tokens, and queueing)
     │
     ▼
[Backend API]
```

### Key Responsibilities:
* **UI Components:** Render forms, display loading states, disable inputs, and map backend error alerts.
* **AppShell Context:** Serves as the single source of truth for the React application tree's authentication state.
* **React Query (`useCurrentUser`):** Owns and caches server state, handling background session verification.
* **Axios API Client (`lib/api.ts`):** Cryptographically communicates with the backend, rotates expired access tokens, and securely transfers HttpOnly cookies.

---

## 2. Access Token & Refresh Token Lifecycles

### Access Token (In-Memory Only)
* **Storage:** Stored strictly in private JS memory variable (`let accessToken`) inside `lib/api.ts`.
* **Exposed Helpers:** `getAccessToken()`, `setAccessToken()`, `clearAccessToken()`.
* **Security Rules:** Never written to `localStorage`, `sessionStorage`, cookies, or global variables. If a page refresh happens, the variable resolves to `null`, triggering a silent token refresh.

### Refresh Token (Secure HttpOnly Cookie)
* **Storage:** Stored exclusively as a secure, HttpOnly, SameSite cookie controlled by the browser.
* **Security Rules:** Completely inaccessible from client-side JavaScript, protecting the session from Cross-Site Scripting (XSS) extraction attacks.

---

## 3. Silent Refresh & Request Queueing Flow

When a request is made with an expired access token, the Axios client automatically rotates the session:

```
[Request fails (401)]
        │
        ▼
[Is another refresh active?] ── Yes ──► [Queue request in failedQueue]
        │ No
        ▼
[Flag isRefreshing = true]
        │
        ▼
[POST /api/auth/refresh]
        │
        ├─► [Success] ──► [Save new accessToken] ──► [Resolve queue & replay original request(s)]
        │
        └─► [Failure] ──► [Clear token] ──► [Dispatch auth-session-expired] ──► [Reject queue]
```

### Concurrency Queue:
If multiple API requests execute in parallel (e.g. page initialization) and all receive a `401 Unauthorized` response simultaneously:
1. The first request intercepts the 401, sets `isRefreshing = true`, and issues a single `POST /auth/refresh` request.
2. The remaining 19 failed requests are pushed into a promise-based queue (`failedQueue`).
3. Once the refresh request finishes, the queue resolves with the new token and all 20 requests replay successfully.
4. Exactly **one** refresh request is sent to the server.

### Logout Race-Condition Protection:
If a user clicks "Logout" while a silent refresh request is still in-flight, the system:
1. Sets `isLoggedOut = true` and calls `clearAccessToken()`.
2. Rejects any pending queued requests immediately.
3. Discards any access token returned by the late-resolving `/auth/refresh` call.
4. Guarantees that the app remains in a logged-out state.

---

## 4. Session Restoration Sequence

1. At application startup, the React Query hook **`useCurrentUser`** fires a `GET /auth/me` request.
2. Since no access token is in memory on cold start, the backend returns a `401 Unauthorized` response.
3. The Axios interceptor intercepts the `401`, kicks off a background `POST /api/auth/refresh` sending the secure cookie, and receives a new access token.
4. The interceptor updates the local access token, attaches it to the original request header, and replays `GET /auth/me`.
5. The replayed `/me` request succeeds, updating the React Query cache and populating the user profile in `AppShellProvider`.

---

## 5. React Query Cache Management

Upon user logout:
* Only authentication-related queries are removed or invalidated:
  ```typescript
  queryClient.removeQueries({ queryKey: ["currentUser"] });
  ```
* Do **NOT** use `queryClient.clear()`. Public resource caches (featured beats, catalog lists, and homepage views) remain cached, preventing layout flashes and redundant network requests.
