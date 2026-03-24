# Blockbuster Security Requirements Document

**Version:** 1.0
**Date:** 2026-03-23
**Classification:** Internal -- Do Not Distribute
**Applies to:** All Blockbuster application code (frontend, backend, infrastructure)

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Authentication Security Spec](#2-authentication-security-spec)
3. [Content Protection Spec](#3-content-protection-spec)
4. [API Security Spec](#4-api-security-spec)
5. [Infrastructure Security](#5-infrastructure-security)
6. [Security Testing Checklist](#6-security-testing-checklist)
7. [Review of Current Implementation](#7-review-of-current-implementation)

---

## 1. Threat Model

Blockbuster is a private, invite-only media streaming platform deployed on a home server. The security posture must assume motivated attackers who may attempt to bypass authentication, scrape media content, or exploit the application to gain unauthorized access. The attack surface includes the Express backend API, the Next.js frontend, WebSocket connections, and direct media file access.

### 1.1 Unauthenticated Access Attempts

| | |
|---|---|
| **Attack** | An attacker discovers the server URL (via DNS, port scan, or social engineering) and attempts to access content without logging in. They may try hitting API endpoints directly, guessing media URLs, or navigating to frontend routes without a session. |
| **Likelihood** | HIGH -- The server is internet-facing (via Cloudflare Tunnel or port forward). Automated scanners will find it. |
| **Impact** | HIGH -- Full media library exposure. Private content leaked. |
| **Mitigation** | (1) Auth middleware on every API route except `/api/health` and `/api/auth/login`. (2) Frontend route guards redirect to login if no valid session. (3) Server-side rendering must not serve protected content without auth -- pages return a login shell only. (4) Cloudflare Access as the production gatekeeper blocks all traffic before it reaches the app unless the user has a valid Cloudflare identity. (5) No static file serving of media directories -- all media goes through the signed-URL streaming endpoint. |

### 1.2 Content Scraping and Downloading (Casual and Automated)

| | |
|---|---|
| **Attack** | An authenticated user (or compromised session) uses browser DevTools, `curl`, `wget`, `youtube-dl`, or custom scripts to download media files. Casual users try right-click "Save As", Ctrl+S, or screen recording. Automated scrapers enumerate the media API and download every file. |
| **Likelihood** | MEDIUM -- Authenticated users are invited and trusted, but insider threat exists. |
| **Impact** | HIGH -- Entire media library exfiltrated and redistributed. |
| **Mitigation** | (1) Signed media URLs with HMAC-SHA256, per-user, per-media, 1-hour TTL. (2) Blob URL rendering in the player -- no raw file paths in the DOM. (3) Auth validation on every HTTP 206 range request chunk. (4) CSP blocks exfiltration vectors (no `connect-src *`, no `media-src *`). (5) Anti-download UI measures: disable right-click on video elements, block Ctrl+S/Ctrl+U/Ctrl+Shift+I keyboard shortcuts, `controlsList="nodownload nofullscreen noremoteplayback"` on video elements. (6) Rate limiting on stream endpoints (30 req/min/IP) prevents bulk download. (7) User-agent filtering to reject known scraping tools. (8) Access logging with per-user download volume monitoring. **Acknowledged limitation:** Screen capture and HDMI capture cannot be prevented at the application layer. |

### 1.3 Session Hijacking and Token Theft

| | |
|---|---|
| **Attack** | An attacker steals a JWT from cookies (via XSS, network sniffing, or physical access to the browser) and replays it to impersonate the user. |
| **Likelihood** | LOW-MEDIUM -- XSS is mitigated by CSP; network sniffing is mitigated by HTTPS. But if either fails, tokens are valuable. |
| **Impact** | HIGH -- Full account takeover, access to all media and social features. |
| **Mitigation** | (1) JWT stored in `httpOnly` cookie -- inaccessible to JavaScript, preventing XSS-based theft. (2) `Secure` flag on cookie -- only sent over HTTPS. (3) `SameSite=Strict` -- prevents CSRF-based token exfiltration. (4) Short-lived access tokens (1 hour). (5) Refresh token rotation -- each refresh invalidates the previous token. (6) Concurrent session limit (max 3 active sessions per user). (7) Strict CSP with no `unsafe-inline` for scripts prevents XSS payload execution. |

### 1.4 Direct Media File URL Access

| | |
|---|---|
| **Attack** | An attacker guesses or discovers the media file path on the server and requests it directly (e.g., `GET /media/movies/Dune.mp4`), bypassing the application layer entirely. |
| **Likelihood** | MEDIUM -- Predictable directory structures make this feasible. |
| **Impact** | HIGH -- Direct file download without authentication. |
| **Mitigation** | (1) NEVER serve `/media` as a static directory. Express must not call `express.static()` on the media directory. (2) All media access goes through `/api/stream/:mediaId` which validates auth + signed URL on every request. (3) Reverse proxy (Caddy/Nginx) must not expose any path to the filesystem except through the Express app. (4) File permissions: media directory readable only by the Express process user (mode 0750). (5) The signing secret is separate from the JWT secret and never exposed to the client. |

### 1.5 JavaScript-Disabled Browsing

| | |
|---|---|
| **Attack** | A user disables JavaScript in their browser, or uses a text-based browser (Lynx, curl), to view the raw HTML of protected pages. If server-side rendering outputs media data into the initial HTML, content is exposed without JS-based protections. |
| **Likelihood** | LOW -- Requires deliberate action by the user. |
| **Impact** | MEDIUM -- May expose media metadata or direct file paths if SSR is misconfigured. |
| **Mitigation** | (1) Server-rendered pages must NOT include media URLs, signed URLs, or file paths in the initial HTML payload. (2) Media data is fetched client-side only after JS initializes and verifies the session. (3) A `<noscript>` tag must display a message: "JavaScript is required to use Blockbuster." (4) The Next.js layout must render an empty shell (app chrome only) server-side; all content is loaded via client-side API calls. (5) CSP headers include `script-src 'self'` only -- no inline scripts that could leak data even if parsed without JS. |

### 1.6 Deep Link and Forced Browsing

| | |
|---|---|
| **Attack** | An attacker crafts URLs to access pages or API endpoints they should not have access to, such as `/api/admin/media`, `/api/users/other-user-id`, or `/media/detail/123` with an invalid session. |
| **Likelihood** | MEDIUM -- Common attack vector, trivially attempted. |
| **Impact** | MEDIUM-HIGH -- Access to admin functions or other users' data. |
| **Mitigation** | (1) Auth middleware on every API route. (2) Admin routes require an `isAdmin` flag on the JWT that maps to a database field -- not a URL pattern check alone. (3) User-scoped queries: watch history, ratings, and profile endpoints filter by `req.user.id`, never by a user-supplied ID parameter for non-admin routes. (4) Frontend route guards check session validity and redirect to login. (5) 404 responses for resources that exist but the user is not authorized to see (avoid information leakage about resource existence). |

### 1.7 Cross-Site Scripting (XSS)

| | |
|---|---|
| **Attack** | An attacker injects malicious JavaScript via user-controlled input fields: display names, media titles (via metadata.json), recommendation messages, watch party chat, or search queries. The script executes in another user's browser, stealing cookies or performing actions on their behalf. |
| **Likelihood** | MEDIUM -- Multiple user input vectors exist (display name, friend messages, recommendation messages). |
| **Impact** | HIGH -- Session hijacking (mitigated by httpOnly cookies), defacement, data exfiltration, actions on behalf of the victim. |
| **Mitigation** | (1) CSP: `script-src 'self'` with NO `unsafe-inline` and NO `unsafe-eval`. This is the primary defense -- even injected script tags will not execute. (2) Output encoding: React's JSX auto-escapes by default. Never use `dangerouslySetInnerHTML`. (3) Input sanitization: server-side validation and sanitization of all user-supplied strings (display names, messages). Strip HTML tags. (4) Maximum field lengths enforced server-side. (5) Content-Type headers: all API responses use `application/json`. (6) `X-Content-Type-Options: nosniff` prevents MIME-sniffing attacks. |

### 1.8 Cross-Site Request Forgery (CSRF)

| | |
|---|---|
| **Attack** | An attacker tricks an authenticated user into visiting a malicious page that makes state-changing requests to the Blockbuster API (e.g., changing their display name, sending friend requests, or modifying ratings). |
| **Likelihood** | LOW -- `SameSite=Strict` on cookies prevents cross-origin cookie attachment. |
| **Impact** | MEDIUM -- Unauthorized actions performed as the victim user. |
| **Mitigation** | (1) `SameSite=Strict` cookie attribute -- browser will not send the cookie on cross-origin requests. This is the primary defense. (2) CORS restricted to the frontend origin only (`FRONTEND_URL`). (3) For defense-in-depth, state-changing endpoints (POST/PUT/PATCH/DELETE) should validate a CSRF token header (e.g., `X-CSRF-Token`) that the frontend obtains from a cookie or initial page load. (4) `Origin` header validation on the backend for non-GET requests. |

### 1.9 Brute Force Login

| | |
|---|---|
| **Attack** | An attacker submits many login attempts to guess valid email addresses or exploit weak authentication flows. In a Cloudflare Access model, this targets the access gateway; in dev mode, it targets the login endpoint. |
| **Likelihood** | MEDIUM -- Automated tools make this trivial. |
| **Impact** | MEDIUM -- Account access if successful, account enumeration even if not. |
| **Mitigation** | (1) Auth endpoint rate limiter: 5 requests per minute per IP (already implemented). (2) Exponential backoff after 3 failed attempts per email. (3) Generic error messages: "Invalid credentials" regardless of whether the email exists. (4) Account lockout after 10 failed attempts within 15 minutes (unlock after 30 minutes or admin action). (5) In production, Cloudflare Access handles authentication -- brute force is mitigated at the edge before reaching the app. |

### 1.10 Account Enumeration

| | |
|---|---|
| **Attack** | An attacker probes the login endpoint, registration endpoint, or friend-request endpoint to determine which email addresses have accounts. Different error messages or response times for existing vs. non-existing emails reveal this. |
| **Likelihood** | MEDIUM -- Standard reconnaissance technique. |
| **Impact** | LOW-MEDIUM -- Reveals the user list of a private platform. |
| **Mitigation** | (1) Login endpoint returns identical error messages and HTTP status codes for "email not found" and "invalid credentials." (2) Response timing must be constant regardless of email existence -- use constant-time comparison for email lookup. (3) Friend request by email: always return 200 "Request sent" even if the email is not registered (store as pending, as designed). (4) No public user search endpoint. (5) Rate limiting on all endpoints that accept email as input. |

### 1.11 Man-in-the-Middle (MITM) Attacks

| | |
|---|---|
| **Attack** | An attacker intercepts network traffic between the client and server to read or modify requests, steal tokens, or inject content. |
| **Likelihood** | LOW on LAN (trusted network), MEDIUM over the internet. |
| **Impact** | CRITICAL -- Full session compromise, content interception, credential theft. |
| **Mitigation** | (1) HTTPS required for all connections in production -- no HTTP fallback. (2) HSTS header with `max-age=31536000; includeSubDomains`. (3) TLS 1.2 minimum (TLS 1.3 preferred) enforced at the reverse proxy. (4) `Secure` flag on all cookies. (5) Certificate pinning is not practical for web apps, but valid certificates (Let's Encrypt or Cloudflare-managed) prevent trivial MITM. (6) Cloudflare Tunnel encrypts traffic from server to Cloudflare edge. |

### 1.12 Screen Capture

| | |
|---|---|
| **Attack** | A user records the screen while playing media using OS-level screen recording, HDMI capture devices, or phone cameras pointed at the monitor. |
| **Likelihood** | HIGH -- Trivially easy and undetectable at the application layer. |
| **Impact** | MEDIUM -- Individual titles can be redistributed, but quality is degraded. |
| **Mitigation** | **This threat cannot be fully mitigated by a web application.** DRM (Widevine/FairPlay) is the industry solution but requires licensing and significant infrastructure changes. For Blockbuster's private, invite-only model: (1) Trust the small user base. (2) Watermark video streams with the user's email as an invisible overlay (forensic watermarking) so leaks can be traced. (3) Log all media access with user ID and timestamps for audit trails. (4) Accept this as a residual risk. |

---

## 2. Authentication Security Spec

### 2.1 Authentication Architecture

```
Production:  Client --> Cloudflare Access (SSO/email auth) --> Backend (verify CF headers) --> JWT issued
Development: Client --> /api/auth/login (stub) --> JWT issued (SKIP_AUTH mode)
```

### 2.2 Cloudflare Access Integration (Production)

- In production, Cloudflare Access sits in front of the application and handles all authentication.
- The backend validates the `Cf-Access-Jwt-Assertion` header on every request.
- The Cloudflare JWT is verified against the Cloudflare Access public key endpoint (`https://<team-domain>.cloudflareaccess.com/cdn-cgi/access/certs`).
- Upon first valid Cloudflare Access request, the backend issues its own application JWT and sets it as a cookie.
- The Cloudflare Access policy must restrict access to only the email allow-list.

### 2.3 JWT Implementation Requirements

| Parameter | Requirement |
|-----------|-------------|
| Algorithm | `HS256` minimum. Consider `RS256` for production to allow public key verification without sharing the secret. |
| Access Token TTL | 1 hour |
| Refresh Token TTL | 7 days |
| Token Storage | `httpOnly` cookie (access token). Refresh token in a separate `httpOnly` cookie. |
| Payload | `{ id, email, displayName, isAdmin, iat, exp }` -- no sensitive data beyond this. |
| Secret Length | Minimum 256 bits (32 bytes) of cryptographically random data. |
| Secret Generation | `openssl rand -hex 32` or `crypto.randomBytes(32).toString('hex')` |
| Rotation | JWT secret rotation requires invalidating all active sessions. Plan for a secret rotation procedure. |
| Refresh Flow | On access token expiry, client calls `/api/auth/refresh`. The server validates the refresh token, issues a new access token AND a new refresh token (rotation). The old refresh token is invalidated immediately. |

### 2.4 Cookie Security

All cookies carrying authentication tokens MUST have these attributes:

```
Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=3600
Set-Cookie: refreshToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=604800
```

| Attribute | Value | Reason |
|-----------|-------|--------|
| `HttpOnly` | Required | Prevents JavaScript access, mitigating XSS token theft |
| `Secure` | Required | Cookie only sent over HTTPS |
| `SameSite` | `Strict` | Prevents CSRF by blocking cross-origin cookie sending |
| `Path` | `/api` (access) or `/api/auth/refresh` (refresh) | Limits cookie scope to relevant endpoints |
| `Max-Age` | Matches token TTL | Cookie expires with the token |
| `Domain` | Not set (defaults to exact origin) | Prevents subdomain leakage |

### 2.5 Session Management

- **Refresh Token Rotation:** Every refresh operation issues a new refresh token and revokes the old one. If a revoked refresh token is presented, ALL sessions for that user must be invalidated (indicates token theft).
- **Concurrent Session Limit:** Maximum 3 active sessions per user. New sessions evict the oldest.
- **Server-Side Session Store:** Refresh tokens are stored in the database (hashed with SHA-256). The server can revoke any session by deleting its record.
- **Logout:** `POST /api/auth/logout` clears both cookies, deletes the refresh token from the database, and returns `Set-Cookie` headers with `Max-Age=0`.

### 2.6 SKIP_AUTH Dev Mode

The `SKIP_AUTH=true` environment variable bypasses authentication for local development.

**CRITICAL SAFEGUARD:** This must be impossible to enable in production.

```typescript
// Required implementation in auth middleware:
if (process.env.SKIP_AUTH === 'true') {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: SKIP_AUTH=true is not allowed in production. Shutting down.');
    process.exit(1);
  }
  req.user = DEV_USER;
  next();
  return;
}
```

Additionally:
- The application startup sequence must check for this condition and refuse to start if `SKIP_AUTH=true` and `NODE_ENV=production`.
- CI/CD pipelines must verify `.env` files do not contain `SKIP_AUTH=true` before deployment.
- The production `.env` template must not include `SKIP_AUTH` at all.

### 2.7 Email Allow-List

Only pre-approved email addresses can access the platform.

- An `allowed_emails` table in the database stores approved emails.
- At login/registration, the email is checked against this table. If not present, return a generic 403: "Access denied."
- Admin-only API to manage the allow-list: `POST /api/admin/allowed-emails`, `DELETE /api/admin/allowed-emails/:email`, `GET /api/admin/allowed-emails`.
- In production, Cloudflare Access enforces this at the edge. The backend allow-list is a defense-in-depth layer.
- The allow-list check must happen BEFORE any user record creation.

---

## 3. Content Protection Spec

### 3.1 Signed URL System

All media access requires a signed URL. No unsigned media requests are ever served.

**Signing Algorithm:** HMAC-SHA256

**Signing Parameters:**

```
signature = HMAC-SHA256(SIGNING_SECRET, userId + ":" + mediaId + ":" + expiresAt)
```

**URL Format:**

```
/api/stream/:mediaId?sig=<hex-signature>&exp=<unix-timestamp>&uid=<user-id>
```

**Validation Steps (on every request including range requests):**

1. Extract `sig`, `exp`, and `uid` from query parameters.
2. Verify `exp` is in the future. If expired, return `403 Forbidden`.
3. Verify `uid` matches the authenticated user's ID from the JWT. If mismatch, return `403 Forbidden`.
4. Recompute the expected signature using the server's `SIGNING_SECRET`.
5. Use constant-time comparison (`crypto.timingSafeEqual`) to compare signatures. If mismatch, return `403 Forbidden`.
6. Serve the requested byte range.

**TTL:** 1 hour. Clients request new signed URLs before expiry. The player UI refreshes signed URLs proactively at 50 minutes.

**SIGNING_SECRET Requirements:**
- Minimum 256 bits, generated with `crypto.randomBytes(32)`.
- Stored in environment variables, never in code.
- Different from `JWT_SECRET`.

### 3.2 Blob URL Rendering

The browser must never see a raw file path or a server-hosted URL for media content in the DOM.

**Implementation:**

1. The frontend fetches a signed streaming URL from the API.
2. For direct MP4 playback, the frontend fetches the media as a Blob via `fetch()` with credentials, then creates a `URL.createObjectURL(blob)` URL.
3. The video element's `src` is set to the `blob:` URL.
4. When the user navigates away, `URL.revokeObjectURL()` is called to free the blob.
5. For HLS streaming, HLS.js loads segments via authenticated fetch calls and renders to the video element. The manifest and segment URLs are never directly set on `<source>` tags.

**Verification:** Inspecting the DOM in DevTools must show `src="blob:..."` on all media elements, never an HTTP URL.

### 3.3 Range Request Validation

HTTP range requests (for seeking in video) must be authenticated and authorized on every chunk.

- The `Range` header is standard HTTP and must be supported for video seeking.
- Auth check happens on EVERY range request, not just the initial one.
- The signed URL parameters (`sig`, `exp`, `uid`) must be present and valid on every range request.
- Response headers include `Accept-Ranges: bytes`, `Content-Range`, and `Content-Length` for the requested range.
- Return `206 Partial Content` for valid range requests, `200 OK` for full file requests.

### 3.4 Content Security Policy (Final)

The CSP must be strict enough to prevent content exfiltration while allowing the application to function.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  media-src 'self' blob:;
  connect-src 'self' wss://<domain>;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  frame-src 'self';
  worker-src 'self' blob:;
  upgrade-insecure-requests
```

**Notes:**

- `style-src 'unsafe-inline'` is required for Tailwind's runtime styles and shadcn/ui. This is an accepted tradeoff -- CSS injection is low-severity compared to script injection.
- `script-src` has NO `unsafe-inline` and NO `unsafe-eval`. If Next.js requires nonces for inline scripts, implement a nonce-based CSP: `script-src 'self' 'nonce-<random>'`.
- `connect-src` must include `wss://` for Socket.io WebSocket connections.
- `frame-src 'self'` is needed for sandboxed HTML5 games.
- `object-src 'none'` blocks Flash/Java plugin embeds.
- `upgrade-insecure-requests` forces HTTPS for all sub-resources in production.
- `worker-src 'self' blob:` is needed for HLS.js web workers.

**Games iframe CSP:** HTML5 games loaded in iframes must use a separate, stricter CSP applied via the `sandbox` attribute:

```html
<iframe
  src="/api/games/:gameId"
  sandbox="allow-scripts allow-same-origin"
  csp="default-src 'self'; script-src 'self'"
></iframe>
```

### 3.5 Anti-Download Measures

These are deterrents, not unbreakable protections. They stop casual users, not determined attackers.

**Required Implementations:**

| Measure | Implementation |
|---------|----------------|
| Right-click block | `oncontextmenu="return false"` on video container and page body |
| Keyboard shortcut blocking | Intercept and `preventDefault()` on: Ctrl+S, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+J, F12, Ctrl+P |
| Video element controls | `controlsList="nodownload"` attribute on `<video>` |
| Drag prevention | `draggable="false"` and `ondragstart="return false"` on video elements |
| CSS overlay | Transparent `<div>` layered above the video element to prevent direct interaction (while passing clicks through for play/pause via JavaScript) |
| Source code inspection | No media file paths anywhere in the server-rendered HTML. All media data loaded via JS API calls only. |
| Developer Tools detection | Optional and unreliable. Log if `window.outerWidth - window.innerWidth > 160` but do not block -- determined users will bypass this. |

### 3.6 Rate Limiting Per Endpoint

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| General API (`/api/*`) | 100 requests | 1 minute per IP |
| Auth endpoints (`/api/auth/*`) | 5 requests | 1 minute per IP |
| Stream endpoints (`/api/stream/*`) | 30 requests | 1 minute per IP |
| Media scan (`/api/media/scan`) | 2 requests | 5 minutes per IP |
| Admin endpoints (`/api/admin/*`) | 20 requests | 1 minute per IP |
| WebSocket connections | 5 connections | 1 minute per IP |
| Search (`/api/media/search`) | 20 requests | 1 minute per IP |

Rate limit responses must return `429 Too Many Requests` with a `Retry-After` header.

### 3.7 Noscript Blocking

Content must be completely inaccessible without JavaScript.

```html
<!-- In the root layout <head> or <body> -->
<noscript>
  <style>
    #__next { display: none !important; }
  </style>
  <div style="text-align:center; padding:50px; font-family:sans-serif;">
    <h1>JavaScript Required</h1>
    <p>Blockbuster requires JavaScript to function. Please enable JavaScript in your browser settings.</p>
  </div>
</noscript>
```

- No media URLs, titles, or metadata in server-rendered HTML.
- The React application shell renders only after JS hydration.
- API calls that fetch content data are client-side only.

### 3.8 Referrer Policy and Iframe Prevention

| Header | Value | Purpose |
|--------|-------|---------|
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Prevents leaking full URL paths to external sites |
| `X-Frame-Options` | `DENY` | Prevents any iframe embedding of Blockbuster pages |
| `frame-ancestors` (CSP) | `'none'` | Modern browsers use this CSP directive over X-Frame-Options |

Both `X-Frame-Options` and `frame-ancestors` are set for defense-in-depth (older browsers use the former, modern browsers the latter).

---

## 4. API Security Spec

### 4.1 Input Validation Requirements

Every endpoint must validate all input parameters. Validation must happen at the middleware layer before any business logic.

**Recommended validation library:** `zod` (TypeScript-native, composable schemas).

| Endpoint | Input | Validation Rules |
|----------|-------|-----------------|
| `POST /api/auth/login` | `email` | Valid email format, max 254 chars, lowercase normalized, checked against allow-list |
| `PATCH /api/users/me` | `displayName` | String, 1-50 chars, alphanumeric + spaces only, HTML stripped |
| `PATCH /api/users/me` | `avatar` (file) | Max 2MB, MIME type `image/jpeg` or `image/png` only (validate magic bytes, not just extension), resize to max 256x256 |
| `GET /api/media` | `type`, `genre` | Enum validation against known values |
| `GET /api/media` | `page`, `limit` | Positive integers, `limit` max 50 |
| `GET /api/media/search` | `q` | String, 1-200 chars, sanitized for FTS5 (escape special chars: `*`, `"`, `OR`, `AND`, `NOT`, `NEAR`) |
| `POST /api/watch-history` | `mediaId` | Valid UUID/integer, must exist in DB |
| `POST /api/watch-history` | `position` | Positive number, max = media duration |
| `POST /api/ratings` | `rating` | Enum: `"up"` or `"down"` only |
| `POST /api/friends` | `email` | Valid email format, not the requesting user's own email |
| `POST /api/recommendations/share` | `mediaId`, `friendId`, `message` | Valid IDs, message max 500 chars, HTML stripped |
| `POST /api/media/scan` | (none) | Admin-only, no user input |
| `PATCH /api/admin/media/:id` | `title`, `description`, `genres`, `keywords` | Strings with length limits, genres/keywords as arrays of strings |

**General rules for all inputs:**

- Reject requests with unexpected fields (strict schema validation, strip unknown keys).
- All string inputs trimmed of leading/trailing whitespace.
- No HTML tags allowed in any text field (strip with a sanitizer like `sanitize-html` or by regex replacing `<[^>]*>`).
- Request body size limit: 1MB for JSON, 5MB for file uploads (configured at the Express level).

### 4.2 SQL Injection Prevention

- **Primary defense:** Drizzle ORM with parameterized queries. NEVER concatenate user input into SQL strings.
- **FTS5 queries:** SQLite FTS5 has its own query syntax. User search input must be escaped before being passed to `MATCH`:
  ```typescript
  // Escape FTS5 special characters
  function escapeFts5(query: string): string {
    return query.replace(/[*"()]/g, ' ').trim();
  }
  ```
- **Raw SQL:** If raw SQL is ever needed (it should not be), use parameterized queries exclusively: `db.run('SELECT * FROM media WHERE id = ?', [mediaId])`.
- **No `eval()` or dynamic query construction from user input.**
- **Database connection:** Use a single connection with WAL mode for SQLite concurrency. Connection string must not be configurable via user input.

### 4.3 CORS Policy

```typescript
app.use(cors({
  origin: FRONTEND_URL,       // Exact match, no wildcard
  credentials: true,          // Required for cookie-based auth
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400,              // Cache preflight for 24 hours
}));
```

**Rules:**
- `origin` must be an exact URL string, NEVER `'*'` or `true` (which reflects any origin).
- In production, `FRONTEND_URL` must be the actual domain (e.g., `https://blockbuster.example.com`).
- `credentials: true` is required for `httpOnly` cookies to be sent cross-origin (backend and frontend are on different ports).
- The backend must NOT echo back the `Origin` header as-is. It must match against the configured whitelist.

### 4.4 Request Size Limits

```typescript
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: false }));
```

File upload endpoints use multer or busboy with explicit limits:
```typescript
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,   // 5MB max for avatar uploads
    files: 1,                      // Single file only
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    cb(null, allowed.includes(file.mimetype));
  },
});
```

### 4.5 Error Response Sanitization

**Development:**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Detailed error message with stack trace for debugging."
  }
}
```

**Production:**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

**Rules:**

- In production (`NODE_ENV=production`), error responses must NEVER include: stack traces, file paths, SQL queries, internal IP addresses, library names/versions, or any implementation details.
- All unhandled errors must be caught by a global error handler middleware that sanitizes the response.
- Validation errors may include field-level detail (e.g., "displayName must be at most 50 characters") but not internal schema information.
- 500 errors always return the generic message in production.
- Errors are logged server-side with full detail for debugging; the client only sees the sanitized version.

```typescript
// Global error handler (must be registered LAST in Express middleware chain)
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err.message, err.stack);

  const status = (err as any).status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(status).json({
    error: {
      code: (err as any).code || 'INTERNAL_ERROR',
      message: isProduction && status === 500
        ? 'An unexpected error occurred.'
        : err.message,
    },
  });
});
```

---

## 5. Infrastructure Security

### 5.1 HTTPS Requirement

- **Production:** ALL traffic must be served over HTTPS. HTTP requests must redirect to HTTPS (301).
- **Reverse Proxy:** Use Caddy (auto-HTTPS) or Nginx + Let's Encrypt (Certbot) in front of the Express app.
- **Cloudflare Tunnel:** If using Cloudflare Tunnel for remote access, Cloudflare handles TLS termination at the edge. The tunnel connection from the server to Cloudflare is also encrypted.
- **LAN-Only Fallback:** For LAN-only access, use a self-signed certificate and instruct users to trust it. Never serve media over plain HTTP, even on LAN.
- **HSTS Header:** `Strict-Transport-Security: max-age=31536000; includeSubDomains` -- set by the reverse proxy, not the Express app (to avoid issues if HTTP is needed during setup).

### 5.2 Firewall Rules

- Only expose ports 80 (HTTP redirect to HTTPS) and 443 (HTTPS) to the network.
- The Express backend port (4000) and Next.js dev server port (3000) must NOT be directly accessible from outside the host. The reverse proxy forwards to them on localhost only.
- SQLite database port: N/A (file-based, no network exposure).
- SSH: If enabled, restrict to key-based auth only, non-default port, fail2ban.
- Cloudflare Tunnel: No inbound ports needed -- the tunnel is outbound only.

### 5.3 Environment Variable Security

- `.env` files must NEVER be committed to version control. Verify `.gitignore` includes `.env*` (but NOT `.env.example`).
- Provide `.env.example` with placeholder values (no real secrets).
- Production secrets must use a different mechanism than `.env` files when possible (Docker secrets, systemd environment files with restricted permissions, or a secrets manager).
- Required environment variables and their security properties:

| Variable | Contains Secret? | Production Requirement |
|----------|-----------------|----------------------|
| `PORT` | No | Any available port, typically 4000 |
| `NODE_ENV` | No | Must be `production` |
| `JWT_SECRET` | YES | Minimum 32 bytes, cryptographically random |
| `SIGNING_SECRET` | YES | Minimum 32 bytes, cryptographically random, different from JWT_SECRET |
| `SKIP_AUTH` | Security-critical | Must NOT exist in production |
| `MEDIA_PATH` | No | Absolute path to media directory |
| `SUBTITLES_PATH` | No | Absolute path to subtitles directory |
| `DATA_PATH` | No | Absolute path to data directory |
| `FRONTEND_URL` | No | Exact production frontend URL with HTTPS |
| `CLOUDFLARE_TEAM_DOMAIN` | No | Cloudflare Access team domain |
| `CLOUDFLARE_AUD` | No | Cloudflare Access application audience tag |

- The `.env` file itself should have mode `0600` (readable only by the owner).

### 5.4 Database File Permissions

- SQLite database file (`blockbuster.db`) must have mode `0600` -- readable and writable only by the Express process user.
- The `/data` directory must have mode `0700`.
- WAL and SHM files (created by SQLite in WAL mode) inherit the permissions of the database file.
- Backups of the database must also be stored with restricted permissions.
- The database file path must not be configurable via any API endpoint or user input.

### 5.5 Log Sanitization

**Never log:**
- JWT tokens (access or refresh)
- Passwords or secrets
- Full cookie headers
- Signed URL signatures
- User email addresses in access logs (use user IDs instead)
- Request bodies that may contain sensitive data

**Always log:**
- Authentication events (login success/failure, logout, token refresh) with user ID and IP.
- Authorization failures (403 responses) with user ID, IP, and requested resource.
- Rate limit triggers with IP.
- Media access events with user ID and media ID (for audit trail).
- Application errors with sanitized details.

**Log format:**

```
[2026-03-23T12:00:00Z] [auth] LOGIN_SUCCESS userId=abc123 ip=192.168.1.5
[2026-03-23T12:00:01Z] [auth] LOGIN_FAILURE ip=10.0.0.1 reason=invalid_email
[2026-03-23T12:00:02Z] [stream] ACCESS userId=abc123 mediaId=movie-456
[2026-03-23T12:00:03Z] [security] RATE_LIMIT ip=10.0.0.1 endpoint=/api/auth/login
```

### 5.6 Dependency Security

- Run `npm audit` as part of the CI pipeline. Fail the build on `high` or `critical` vulnerabilities.
- Use `npm ci` (not `npm install`) in production to install from the lockfile exactly.
- Commit `package-lock.json` to version control.
- Review new dependencies before adding them: check npm download counts, last publish date, maintainer count, and known issues.
- Pin exact versions in `package.json` (no `^` or `~` for production dependencies) OR rely on lockfile pinning with `npm ci`.
- Run `npm audit` monthly even without code changes.
- Consider using Socket.dev or Snyk for supply chain monitoring.

---

## 6. Security Testing Checklist

This checklist must be executed before each release. Every item must pass.

### 6.1 Authentication Tests

- [ ] `GET /api/media` without auth token returns `401 Unauthorized`
- [ ] `GET /api/media` with an expired JWT returns `401 Unauthorized`
- [ ] `GET /api/media` with a JWT signed by a different secret returns `401 Unauthorized`
- [ ] `GET /api/media` with a malformed JWT (truncated, extra characters) returns `401 Unauthorized`
- [ ] `POST /api/auth/login` with an email NOT on the allow-list returns `403 Forbidden`
- [ ] `POST /api/auth/login` with an invalid email format returns `400 Bad Request`
- [ ] Login with a valid email sets `httpOnly`, `Secure`, `SameSite=Strict` cookies
- [ ] Cookies are not accessible via `document.cookie` in the browser console
- [ ] `POST /api/auth/logout` clears the auth cookies
- [ ] After logout, previously valid token is rejected (if using a revocation list)
- [ ] Refresh token rotation: old refresh token is rejected after a new one is issued
- [ ] Presenting a revoked refresh token invalidates ALL sessions for that user

### 6.2 Authorization Tests

- [ ] Non-admin user accessing `/api/admin/*` returns `403 Forbidden`
- [ ] User A cannot access User B's watch history via direct API call
- [ ] User A cannot modify User B's profile via `PATCH /api/users/:userId`
- [ ] Non-existent resource IDs return `404 Not Found`, not `403` (no information leakage about resource existence to unauthorized users)

### 6.3 Content Protection Tests

- [ ] `GET /api/stream/:mediaId` without a signed URL returns `403 Forbidden`
- [ ] `GET /api/stream/:mediaId` with an expired signature returns `403 Forbidden`
- [ ] `GET /api/stream/:mediaId` with a signature generated for a different user returns `403 Forbidden`
- [ ] `GET /api/stream/:mediaId` with a signature generated for a different media ID returns `403 Forbidden`
- [ ] `GET /api/stream/:mediaId` with a tampered signature returns `403 Forbidden`
- [ ] Direct request to a guessable file path (e.g., `/media/movies/test.mp4`) returns `404` (not served)
- [ ] Disable JavaScript in browser, navigate to a media page: no content visible, noscript message displayed
- [ ] Right-click on the video player: browser context menu does not appear
- [ ] Ctrl+S on a media page: browser "Save As" dialog does not appear (or only saves the HTML shell)
- [ ] View page source (Ctrl+U): no media file paths, no signed URLs, no direct file references
- [ ] Open DevTools, inspect the video element `src` attribute: value is `blob:...` not an HTTP URL
- [ ] Copy the blob URL and paste into a new tab: does not play (blob URLs are origin-scoped and session-scoped)
- [ ] `curl` the stream endpoint without cookies: returns `401`
- [ ] `wget -r` the API: rate limited after the configured threshold
- [ ] Attempt to access the stream endpoint from a different origin via fetch: CORS blocks the request

### 6.4 Input Validation Tests

- [ ] `GET /api/media/search?q='; DROP TABLE media;--` returns results safely (no SQL injection)
- [ ] `GET /api/media/search?q=<script>alert(1)</script>` returns sanitized results (no XSS reflection)
- [ ] `PATCH /api/users/me` with `displayName` containing `<img src=x onerror=alert(1)>` stores sanitized value
- [ ] `PATCH /api/users/me` with `displayName` longer than 50 characters returns `400 Bad Request`
- [ ] Upload avatar with file size > 5MB returns `400 Bad Request`
- [ ] Upload avatar with `.exe` extension renamed to `.jpg` is rejected (magic byte validation)
- [ ] `POST /api/watch-history` with negative position value returns `400 Bad Request`
- [ ] `POST /api/ratings` with rating value `"neutral"` (not in enum) returns `400 Bad Request`
- [ ] JSON body larger than 1MB returns `413 Payload Too Large`

### 6.5 CSRF and CORS Tests

- [ ] `POST /api/ratings` from a different origin (e.g., `http://evil.com`) is blocked by CORS
- [ ] `<form action="http://blockbuster/api/ratings" method="POST">` submitted from an external page: `SameSite=Strict` prevents cookie attachment, request fails with `401`
- [ ] Preflight `OPTIONS` request from unauthorized origin returns no `Access-Control-Allow-Origin` header
- [ ] `GET /api/media` with `Origin: http://evil.com` does not reflect the origin in CORS headers

### 6.6 Rate Limiting Tests

- [ ] Send 6 requests to `POST /api/auth/login` within 1 minute: 6th request returns `429 Too Many Requests`
- [ ] `Retry-After` header is present in the `429` response
- [ ] Send 101 requests to `GET /api/media` within 1 minute: 101st returns `429`
- [ ] Send 31 requests to `GET /api/stream/:id` within 1 minute: 31st returns `429`

### 6.7 Security Header Tests

- [ ] Response includes `Content-Security-Policy` header with `script-src 'self'` (no `unsafe-inline`)
- [ ] Response includes `X-Content-Type-Options: nosniff`
- [ ] Response includes `X-Frame-Options: DENY`
- [ ] Response includes `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Response includes `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] Attempt to embed Blockbuster in an `<iframe>` on another site: blocked by `X-Frame-Options` and `frame-ancestors 'none'`
- [ ] HTTPS response includes `Strict-Transport-Security` header
- [ ] HTTP request to port 80 returns `301` redirect to HTTPS

### 6.8 WebSocket Security Tests

- [ ] Socket.io connection without a valid JWT cookie is rejected
- [ ] Socket.io connection with an expired JWT is rejected
- [ ] Emoji reaction rate limit: more than 1 emoji per second per user is throttled
- [ ] Watch session with more than 2 participants is rejected
- [ ] Injecting HTML/script via emoji or chat message: sanitized on display

### 6.9 Infrastructure Tests

- [ ] Port scan the host: only ports 80 and 443 are open
- [ ] `GET /.env` returns `404 Not Found`
- [ ] `GET /data/blockbuster.db` returns `404 Not Found`
- [ ] `npm audit` reports no high or critical vulnerabilities
- [ ] `.env` file is listed in `.gitignore`
- [ ] `git log --all -- '*.env'` returns no results (no `.env` files in git history)
- [ ] Application startup with `NODE_ENV=production` and `SKIP_AUTH=true` fails immediately

### 6.10 Privacy and Data Protection Tests

- [ ] Server access logs do not contain JWT tokens
- [ ] Server access logs do not contain email addresses (user IDs only)
- [ ] Error responses in production do not contain stack traces or file paths
- [ ] `GET /api/users/me` does not return password hashes or internal IDs not needed by the client

---

## 7. Review of Current Implementation

This section audits the existing middleware code at the time of this document's creation (Phase 1).

### 7.1 Files Reviewed

| File | Path |
|------|------|
| Security headers middleware | `/mnt/c/Users/karen/Desktop/Blockbuster/backend/src/middleware/security.ts` |
| Auth middleware | `/mnt/c/Users/karen/Desktop/Blockbuster/backend/src/middleware/auth.ts` |
| Rate limit middleware | `/mnt/c/Users/karen/Desktop/Blockbuster/backend/src/middleware/rate-limit.ts` |
| Application entry point | `/mnt/c/Users/karen/Desktop/Blockbuster/backend/src/index.ts` |
| Environment config | `/mnt/c/Users/karen/Desktop/Blockbuster/backend/.env` |

### 7.2 Findings

| # | Severity | Category | File | Description | Remediation |
|---|----------|----------|------|-------------|-------------|
| 1 | **CRITICAL** | Auth Bypass | `auth.ts:13` | `SKIP_AUTH=true` has no guard against running in production. If `NODE_ENV=production` is accidentally combined with `SKIP_AUTH=true`, all authentication is bypassed. | Add a check: if `SKIP_AUTH=true` and `NODE_ENV=production`, call `process.exit(1)` immediately. Also add a startup check in `index.ts`. |
| 2 | **CRITICAL** | Secrets Management | `.env:3` | `JWT_SECRET=blockbuster-dev-secret-change-in-production` is a weak, guessable secret. If this value leaks into production, any attacker can forge valid JWTs. | Generate a cryptographically random secret: `openssl rand -hex 32`. Add a startup check that rejects secrets shorter than 32 characters or matching known defaults when `NODE_ENV=production`. |
| 3 | **CRITICAL** | Secrets Management | `.env:4` | `SIGNING_SECRET=blockbuster-signing-secret-change-in-production` has the same weakness as the JWT_SECRET. | Same remediation as finding #2. |
| 4 | **HIGH** | CSP | `security.ts:9` | `style-src 'unsafe-inline'` is present, which is a known weakening. While acceptable for Tailwind, it should be documented as an accepted risk with a plan to migrate to nonce-based styles if feasible. | Accepted risk for now. Document the tradeoff. Investigate Next.js nonce support for a future hardening pass. |
| 5 | **HIGH** | CSP (Missing) | `security.ts` | CSP is missing: `connect-src`, `font-src`, `object-src`, `base-uri`, `worker-src`, and `upgrade-insecure-requests`. An incomplete CSP leaves gaps that attackers can exploit. | Add all missing directives as specified in Section 3.4 of this document. |
| 6 | **HIGH** | JWT Validation | `auth.ts:37` | `jwt.verify()` does not specify the expected algorithm. An attacker could craft a token using the `none` algorithm or `HS256` with the public key if `RS256` is intended. | Pass `{ algorithms: ['HS256'] }` as the options parameter to `jwt.verify()`. |
| 7 | **HIGH** | Auth | `auth.ts` | No email allow-list check after JWT verification. A valid JWT for a removed user would still grant access. | After decoding the JWT, verify the user still exists in the database and is on the allow-list. |
| 8 | **MEDIUM** | Headers (Missing) | `security.ts` | Missing `Strict-Transport-Security` header. Without HSTS, users can be downgraded to HTTP. | Add `res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')` (conditionally, only when `NODE_ENV=production` or behind a reverse proxy). |
| 9 | **MEDIUM** | Rate Limiting | `rate-limit.ts` | Rate limiting is IP-based only. Behind a reverse proxy (Caddy/Nginx/Cloudflare), all requests may appear from `127.0.0.1` unless `trust proxy` is configured. | Configure Express `app.set('trust proxy', 1)` when behind a reverse proxy, and ensure the proxy sets `X-Forwarded-For`. Also add user-based rate limiting for authenticated endpoints. |
| 10 | **MEDIUM** | Request Size | `index.ts:23` | `express.json()` is called without a `limit` option. The default is 100KB, which is reasonable but should be explicit. | Change to `express.json({ limit: '1mb' })` and document the choice. |
| 11 | **MEDIUM** | CORS | `index.ts:21` | CORS configuration does not set `maxAge` or restrict `methods`/`allowedHeaders`. Missing `maxAge` means preflight requests happen on every call. | Add `methods`, `allowedHeaders`, and `maxAge` to the CORS config as specified in Section 4.3. |
| 12 | **LOW** | Security Header | `security.ts:19` | `X-XSS-Protection: 1; mode=block` is deprecated and can cause information leakage in some browsers. Modern CSP is the correct XSS defense. | Remove this header or set it to `0` to disable the legacy XSS auditor. CSP `script-src 'self'` is the proper protection. |
| 13 | **LOW** | Error Handling | `index.ts` | No global error handler middleware registered. Unhandled errors may return default Express error pages with stack traces. | Add a global error handler as the last middleware, as specified in Section 4.5. |
| 14 | **INFO** | Dev Credentials | `.env:5` | `SKIP_AUTH=true` is enabled in the development `.env`. This is correct for development but must never propagate to production. | Add a production `.env.example` without `SKIP_AUTH`. Add CI checks to ensure `SKIP_AUTH` is not present in production configs. |

### 7.3 Positive Observations

The following security practices are already correctly implemented:

1. **Cookie-based JWT storage.** The auth middleware reads tokens from `req.cookies.token` (httpOnly cookie), not from `Authorization` headers or URL parameters. This is the correct approach for XSS-resistant token storage.

2. **Security headers are applied globally.** The `securityHeaders` middleware is registered early in the middleware chain via `app.use(securityHeaders)`, ensuring all responses get security headers.

3. **Rate limiting is tiered.** Three rate limit configurations exist for different endpoint categories (general, auth, stream), showing thoughtful consideration of different abuse profiles.

4. **CORS is restricted.** The CORS origin is set to `FRONTEND_URL` (not `*`), and `credentials: true` is set correctly for cookie-based auth.

5. **CSP `frame-ancestors 'none'`** is set alongside `X-Frame-Options: DENY`, providing defense-in-depth against clickjacking.

6. **Error messages are generic.** The auth middleware returns "Authentication required" and "Invalid or expired token" without leaking internal details about why authentication failed.

7. **JWT secret absence is handled.** The auth middleware checks for the existence of `JWT_SECRET` and throws an error if it is not configured.

8. **`Permissions-Policy` header** restricts camera, microphone, and geolocation access.

### 7.4 Priority Remediation Order

1. **Immediate (before any deployment):** Findings #1 (SKIP_AUTH production guard), #2 (JWT_SECRET strength), #3 (SIGNING_SECRET strength), #6 (JWT algorithm pinning).
2. **Before Phase 3 (streaming):** Finding #5 (complete CSP), #8 (HSTS), #9 (trust proxy for rate limiting).
3. **Before Phase 4 (auth system):** Finding #7 (email allow-list check), #11 (CORS hardening).
4. **Before Phase 8 (production):** Findings #10, #12, #13 (request limits, deprecated header removal, global error handler).

---

## Appendix A: Secure Configuration Templates

### Production .env.example

```env
PORT=4000
NODE_ENV=production
JWT_SECRET=           # Generate with: openssl rand -hex 32
SIGNING_SECRET=       # Generate with: openssl rand -hex 32 (must differ from JWT_SECRET)
MEDIA_PATH=/path/to/media
SUBTITLES_PATH=/path/to/subtitles
DATA_PATH=/path/to/data
FRONTEND_URL=https://blockbuster.yourdomain.com
CLOUDFLARE_TEAM_DOMAIN=yourteam
CLOUDFLARE_AUD=your-cloudflare-access-audience-tag
# SKIP_AUTH must NEVER be set in production
```

### Caddy Reverse Proxy Configuration

```caddyfile
blockbuster.yourdomain.com {
    # Automatic HTTPS via Let's Encrypt
    reverse_proxy /api/* localhost:4000
    reverse_proxy localhost:3000

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
}
```

## Appendix B: Security Incident Response

If a security incident is suspected:

1. **Contain:** Disable the affected user account or shut down the Cloudflare Tunnel.
2. **Investigate:** Review access logs for the affected time period. Check for unusual media access patterns.
3. **Rotate:** Rotate `JWT_SECRET` and `SIGNING_SECRET`. This invalidates all active sessions.
4. **Notify:** Inform affected users if their data may have been exposed.
5. **Fix:** Patch the vulnerability and re-run the security testing checklist.
6. **Document:** Record the incident, root cause, and remediation steps.
