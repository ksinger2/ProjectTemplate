# Blockbuster -- Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-23
**Author:** Principal Product Manager
**Status:** Draft

---

## Table of Contents

1. [Product Vision and Goals](#1-product-vision-and-goals)
2. [User Personas](#2-user-personas)
3. [Feature Requirements](#3-feature-requirements)
4. [User Flows](#4-user-flows)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Content Management](#6-content-management)
7. [Metrics and Analytics](#7-metrics-and-analytics)
8. [Launch Checklist](#8-launch-checklist)

---

## 1. Product Vision and Goals

### What Blockbuster Is

Blockbuster is a self-hosted, private media streaming web application that gives individuals and families a Netflix-like experience over their own media library. It runs on a home server or NAS, serves movies, TV shows, music, and HTML5 games to authenticated users, and layers social features (friends, shared recommendations, synchronized watch sessions) on top to make media consumption a shared experience.

Blockbuster is not a public service. It is not monetized. There is no subscription, no ads, no cloud dependency, and no AI/ML inference cost. It is software you own, running on hardware you own, serving media you own.

### Who It Is For

- Small households (2-8 people) who maintain a personal media library
- Friend groups who want to watch together remotely over a VPN or Cloudflare Tunnel
- Users who have outgrown folder-based file sharing and want a polished browsing and playback experience
- Privacy-conscious users who refuse to send viewing data to third-party services

### Core Value Proposition

| Pillar | Description |
|--------|-------------|
| Own your media | No reliance on streaming service catalogs, licensing rotations, or subscription fatigue |
| Netflix-grade experience | Horizontal scroll rows, continue watching, personalized recommendations, instant search, and a polished video player |
| Social by default | Friends list, shared recommendations with messages, synchronized watch-together sessions with emoji reactions |
| Zero ops, zero cost | SQLite database, no external services, single `npm run dev` or `docker compose up` to launch |

### Success Metrics

Because Blockbuster is private and non-commercial, success is measured by engagement and utility, not revenue.

| Metric | Target | Rationale |
|--------|--------|-----------|
| Weekly active users (WAU) | 60% of registered users | Indicates the platform is the default way users access their library |
| Median session duration | > 20 minutes | Users are watching content, not just browsing |
| Continue Watching resume rate | > 50% of in-progress items resumed within 7 days | The continue-watching feature is delivering its core job |
| Search-to-play conversion | > 30% of searches lead to playback within 5 minutes | Search surfaces relevant results |
| Friend request acceptance rate | > 70% | Social features are wanted and used |
| Watch-together sessions per week | >= 1 per active friend pair | Sync playback is a real use case, not a novelty |
| Recommendation click-through rate | > 15% of recommended items clicked | Recommendations surface useful content |
| Library scan completion rate | 100% of dropped files appear in UI after scan | Scanner is reliable |

---

## 2. User Personas

### Primary: The Host

**Name:** Alex
**Role:** Server owner, library curator, system administrator
**Demographics:** Tech-savvy, maintains a NAS or home server, comfortable with Docker and command-line tools

**Goals:**
- Drop media files into a folder structure and have them appear in a polished UI automatically
- Invite family and friends without managing complex user administration
- Edit metadata (descriptions, genres, posters) when the scanner gets it wrong
- Monitor that the system is running correctly without ongoing maintenance

**Frustrations:**
- Plex and Jellyfin are bloated and require constant updates
- Metadata fetching from external APIs introduces privacy concerns and rate limits
- Existing solutions lack meaningful social features

**Jobs To Be Done:**
- "When I acquire new media, I want to add it to my library in under 2 minutes so my family can watch it tonight."
- "When metadata is wrong, I want to fix it in a web UI without editing JSON files on disk."
- "When a friend asks what to watch, I want to send them a recommendation inside the app."

### Secondary: The Viewer

**Name:** Sam
**Role:** Invited user, consumer of media, social participant
**Demographics:** Non-technical, uses the platform because the Host invited them. May access from a laptop, tablet, or phone.

**Goals:**
- Browse and discover content easily
- Pick up where they left off
- Get recommendations tailored to their taste
- Watch together with the Host or other friends

**Frustrations:**
- Forgot what episode they were on
- Cannot find content they vaguely remember
- Wants to share reactions but has to use a separate messaging app

**Jobs To Be Done:**
- "When I open Blockbuster, I want to see what I was watching so I can resume immediately."
- "When I do not know what to watch, I want personalized suggestions based on what I have liked."
- "When a friend is also online, I want to start a watch-together session without any setup friction."

### Edge: The Mobile User

**Name:** Jordan
**Role:** Primarily accesses Blockbuster from a phone
**Demographics:** Watches during commutes or in bed, strong preference for vertical scrolling and touch gestures

**Goals:**
- Full functionality on mobile without a native app
- Install as a PWA for home screen access
- Touch-friendly video controls (swipe to seek, double-tap to skip)

**Frustrations:**
- Horizontal scroll rows are hard to navigate on small screens
- Video player controls are too small for touch
- Page loads are slow on cellular connections (if accessing via tunnel)

**Jobs To Be Done:**
- "When I am on my phone, I want the same browsing and playback experience as desktop."
- "When I install the PWA, I want it to feel like a native app with a home screen icon."

---

## 3. Feature Requirements

### P0 -- Must Have (Launch Blockers)

#### 3.1 Media Library Browsing

**Description:** Users can browse the entire media library organized by type (movies, shows, music, games) in a Netflix-style grid with horizontal scroll rows grouped by genre, recent additions, and curated categories.

**Acceptance Criteria:**
- [ ] Home page loads within 2 seconds on localhost with a library of 500+ titles
- [ ] Movies, shows, music, and games each have a dedicated category row
- [ ] Each media card displays: thumbnail (or generated poster frame), title, year, and duration
- [ ] Clicking a card opens a detail page with description, genres, keywords, episode list (if show), and play button
- [ ] Horizontal scroll rows support mouse drag, scroll wheel, and touch swipe
- [ ] On viewports below 768px, rows switch to a vertical 2-column grid
- [ ] Empty state: when library is empty, display a message directing the Host to add media files and run a scan
- [ ] Genre filter is available on the home page to narrow visible rows
- [ ] Pagination: rows lazy-load additional items on scroll (not full page reload)

**Dependencies:** Media scanner (Phase 2), thumbnail generation (Phase 2)

#### 3.2 Video Playback

**Description:** Clicking play on any video media item starts playback in a Plyr.io-based player with HLS.js fallback. The player supports fullscreen, picture-in-picture, and half-screen modes.

**Acceptance Criteria:**
- [ ] H.264/AAC `.mp4` files play via direct HTTP 206 range-request streaming
- [ ] Non-H.264 codecs trigger on-demand HLS transcoding via ffmpeg
- [ ] Video starts playback within 3 seconds of clicking play on localhost
- [ ] Seeking works: dragging the progress bar loads the correct position within 2 seconds
- [ ] Fullscreen mode works on Chrome, Firefox, Safari, and Edge
- [ ] Picture-in-Picture mode works via browser API; a CSS-based fallback is provided for browsers that lack PiP support
- [ ] Half-screen mode splits the viewport: video on one side, detail/episode list on the other
- [ ] Media URLs are signed with HMAC-SHA256 and expire after 1 hour
- [ ] Media is served via blob URLs; no raw file path is exposed in the DOM or network tab
- [ ] Duration is displayed on all media cards and on the detail page

**Dependencies:** Signed URL service (Phase 3), ffmpeg/ffprobe availability

#### 3.3 Search

**Description:** A global search bar allows users to find media by title, description, genre, or keyword using SQLite FTS5 full-text search.

**Acceptance Criteria:**
- [ ] Search bar is accessible from every page (persistent in header/nav)
- [ ] Results appear within 500ms of the user stopping typing (debounced at 300ms)
- [ ] Results include media type icon, title, year, and relevance-ordered ranking
- [ ] Partial matches work: searching "dun" returns "Dune"
- [ ] Empty search query shows no results (not the full library)
- [ ] No results state: "No results for [query]. Try a different search term."
- [ ] Search works across titles, descriptions, genres, and keywords
- [ ] Results are clickable and navigate to the media detail page
- [ ] On mobile, search bar expands from an icon tap to a full-width input

**Dependencies:** FTS5 virtual table (Phase 1), media scanner populates searchable fields (Phase 2)

#### 3.4 User Profiles

**Description:** Each authenticated user has a profile with a display name and avatar. The profile is used for personalized greetings, watch history, and social features.

**Acceptance Criteria:**
- [ ] User can set a display name (1-50 characters, alphanumeric and spaces)
- [ ] User can upload an avatar image (JPEG/PNG, max 2MB, cropped to square)
- [ ] Avatar is stored in `/data/avatars/` with the user ID as filename
- [ ] Default avatar is a colored circle with the user's first initial
- [ ] Home page displays "Welcome back, [Display Name]" greeting
- [ ] Profile page shows display name, avatar, and an edit form
- [ ] Changes save within 1 second and reflect immediately without page reload

**Dependencies:** Auth system (Phase 4), user table (Phase 1)

#### 3.5 Continue Watching

**Description:** Users see a "Continue Watching" row on the home page showing movies and TV episodes they started but did not finish.

**Acceptance Criteria:**
- [ ] A media item appears in Continue Watching when playback reaches at least 5% of total duration
- [ ] A media item is removed from Continue Watching when playback reaches 90% of total duration (considered "complete")
- [ ] The player sends the current playback position to the server every 10 seconds
- [ ] Clicking a Continue Watching item resumes playback from the last saved position (within 5 seconds of where the user left off)
- [ ] Continue Watching row shows a progress bar overlay on each card indicating percent watched
- [ ] Music and games do not appear in Continue Watching
- [ ] For TV shows, the card shows the specific episode (e.g., "S01E03 - The Rains of Castamere")
- [ ] If a show episode is completed, the next unwatched episode takes its place in Continue Watching
- [ ] Row is empty state: hidden entirely (no empty row displayed)

**Dependencies:** Watch history tracking (Phase 4), playback position API

#### 3.6 Authentication

**Description:** Users log in via email. The system issues JWT tokens stored in httpOnly cookies. A Cloudflare Access header stub is supported for production deployments.

**Acceptance Criteria:**
- [ ] `POST /api/auth/login` accepts an email and returns a JWT in an httpOnly, Secure, SameSite=Strict cookie
- [ ] Access token expires after 1 hour; refresh token expires after 7 days
- [ ] Token refresh happens transparently: the user is never asked to re-login within the 7-day window
- [ ] All `/api/*` routes (except `/api/health` and `/api/auth/login`) require a valid JWT
- [ ] Requests without a valid token receive a 401 response with a JSON error body
- [ ] `SKIP_AUTH=true` environment variable disables auth for local development
- [ ] Login page: email input, submit button, error message on invalid credentials
- [ ] After login, user is redirected to the home page
- [ ] Logout clears the cookie and redirects to the login page

**Dependencies:** User table (Phase 1), JWT library

#### 3.7 Media Scanning

**Description:** The Host triggers a scan that walks the `/media` directory tree, extracts metadata via ffprobe, generates thumbnails, discovers subtitle files, and upserts all entries into the database.

**Acceptance Criteria:**
- [ ] `POST /api/media/scan` triggers a full scan of `/media/{movies,shows,music,games}`
- [ ] Scanner reads `metadata.json` sidecar files for title, description, genres, keywords, year, and poster path
- [ ] Scanner parses show folder conventions: `shows/ShowName/Season 01/S01E01 - Title.mp4`
- [ ] Scanner extracts duration and codec info via ffprobe for every media file
- [ ] Scanner generates a thumbnail for each video by extracting a frame at 10% of duration via ffmpeg
- [ ] Thumbnails are stored in `/data/thumbnails/` named by media ID
- [ ] Scanner discovers subtitle files in `/subtitles/` matching the media slug and language code
- [ ] Duplicate files (same path) are updated, not duplicated, on re-scan
- [ ] Deleted files are removed from the database on re-scan
- [ ] Scan progress is returned via the API (or logged) so the Host knows it is working
- [ ] A library of 1000 files completes scanning within 10 minutes

**Dependencies:** ffmpeg and ffprobe installed on the server, SQLite schema (Phase 1)

---

### P1 -- Should Have (First Sprint After Launch)

#### 3.8 Recommendations Engine

**Description:** Personalized "Recommended For You" and "Because You Watched [Title]" rows on the home page, driven by attribute-based scoring (no AI/ML).

**Acceptance Criteria:**
- [ ] `GET /api/recommendations` returns up to 20 recommended media items for the authenticated user
- [ ] Scoring weights: genre overlap with liked items (3x), keyword overlap (2x), recency bonus for new additions (1x), penalty for already-watched items
- [ ] `GET /api/recommendations/because/:mediaId` returns items similar to a specific title
- [ ] Home page shows a "Recommended For You" row
- [ ] Home page shows up to 3 "Because You Watched [Title]" rows based on the user's 3 most recent watches
- [ ] Cold start: users with no watch history or ratings see "Recently Added" and a genre sampler
- [ ] Recommendations update within 1 minute of a new rating or completed watch

**Dependencies:** Watch history (Phase 4), ratings (Phase 4), media metadata (Phase 2)

#### 3.9 Ratings

**Description:** Users can rate media with a thumbs up or thumbs down. Ratings feed into the recommendation engine.

**Acceptance Criteria:**
- [ ] Each media detail page has a thumbs-up and thumbs-down button
- [ ] A user can have at most one rating per media item (up or down)
- [ ] Clicking the same thumb again removes the rating (toggle behavior)
- [ ] Switching from up to down (or vice versa) updates the rating in a single action
- [ ] `POST /api/ratings` accepts `{ mediaId, rating: 'up' | 'down' | null }`
- [ ] Rating state is visually reflected (filled icon for active rating)
- [ ] Rating changes are persisted within 500ms

**Dependencies:** Auth (Phase 4), media detail page (Phase 2)

#### 3.10 Subtitles

**Description:** The player supports multiple subtitle tracks in SRT and VTT formats with a language selector.

**Acceptance Criteria:**
- [ ] VTT files are served natively as text tracks
- [ ] SRT files are auto-converted to VTT at serve time by the backend
- [ ] The player displays a subtitle/CC button when at least one subtitle track is available
- [ ] Users can switch between available languages mid-playback without interruption
- [ ] Subtitle file naming convention: `{media-slug}.{language-code}.{vtt|srt}`
- [ ] Episode subtitle convention: `{show-slug}.s01e01.{language-code}.{vtt|srt}`
- [ ] Subtitle text is rendered with a semi-transparent background for readability
- [ ] An "Off" option is always present to disable subtitles

**Dependencies:** Subtitle discovery in scanner (Phase 2), player component (Phase 3)

#### 3.11 Episodic Navigation

**Description:** TV shows support browsing by season and episode with auto-advance to the next episode.

**Acceptance Criteria:**
- [ ] Show detail page displays a season dropdown (or tab bar) listing all available seasons
- [ ] Selecting a season lists all episodes in order with title, episode number, duration, and thumbnail
- [ ] Clicking an episode starts playback of that specific episode
- [ ] When an episode ends (reaches 90% completion), the next episode auto-plays after a 10-second countdown with a "Cancel" button
- [ ] If the user is on the last episode of a season, the next episode is the first of the next season
- [ ] If the user is on the final episode of the final season, auto-advance does not trigger
- [ ] Episode cards in the list show a "watched" indicator (checkmark) for completed episodes
- [ ] Currently playing episode is visually highlighted in the episode list

**Dependencies:** Show folder parsing in scanner (Phase 2), watch history (Phase 4)

#### 3.12 Admin Metadata UI

**Description:** The Host can view and edit metadata for any media item through a web-based admin panel.

**Acceptance Criteria:**
- [ ] Admin page is accessible only to users with the `admin` role
- [ ] `GET /api/admin/media` returns all media items with current metadata
- [ ] Admin page lists all media items in a searchable, sortable table
- [ ] Clicking a row opens an edit form with fields: title, description, genres (tag input), keywords (tag input), year, poster image upload
- [ ] `PATCH /api/admin/media/:id` updates the specified fields
- [ ] Changes persist to the database and are reflected on the public-facing UI immediately
- [ ] Editing a field does not overwrite `metadata.json` on disk (database is source of truth after first scan)
- [ ] Validation: title is required, year must be a 4-digit number, genres and keywords are arrays of non-empty strings
- [ ] Non-admin users who attempt to access `/admin` routes receive a 403 response

**Dependencies:** Auth with roles (Phase 4), media table (Phase 1)

---

### P2 -- Nice to Have (Post-Launch Enhancements)

#### 3.13 Friends

**Description:** Users can add friends by email. Accepted friends can share recommendations and start watch-together sessions.

**Acceptance Criteria:**
- [ ] `POST /api/friends` sends a friend request by email
- [ ] If the email is not yet registered, the request is stored as pending and fulfilled when the user signs up
- [ ] `GET /api/friends` returns the user's friend list with statuses: pending_sent, pending_received, accepted, blocked
- [ ] Recipient can accept or reject a pending request
- [ ] Accepting is mutual: both users appear in each other's friend lists
- [ ] Users can block a friend, which removes them from the friend list and prevents future requests
- [ ] Friend count is displayed on the user's profile
- [ ] Notification badge appears when there are pending incoming requests

**Dependencies:** Auth (Phase 4), user table (Phase 1)

#### 3.14 Shared Recommendations

**Description:** Users can share a media title with a friend along with an optional message.

**Acceptance Criteria:**
- [ ] Media detail page shows a "Share" button (visible only to users with at least one friend)
- [ ] Clicking "Share" opens a modal with a friend selector and an optional message field (max 280 characters)
- [ ] `POST /api/recommendations/share` sends the recommendation to the selected friend
- [ ] `GET /api/recommendations/inbox` returns incoming recommendations with sender name, media details, message, and read/unread status
- [ ] Unread recommendation count is shown as a badge in the navigation
- [ ] A "Friends Recommend" row appears on the home page showing media shared by friends
- [ ] Clicking a recommendation navigates to the media detail page
- [ ] Users can dismiss a recommendation (marks it as read, removes from inbox)

**Dependencies:** Friends (3.13), media detail page (Phase 2)

#### 3.15 Watch Together

**Description:** Two users can watch the same media in sync with shared playback controls and real-time emoji reactions.

**Acceptance Criteria:**
- [ ] `POST /api/watch-sessions` creates a session linked to a specific media item; the creator is the host
- [ ] Host can invite exactly one friend (max 2 participants per session)
- [ ] Invited friend receives a real-time notification (via Socket.io) with a "Join" button
- [ ] Both users see the same video; the host's playback state is the source of truth
- [ ] Play, pause, and seek events from the host are broadcast to the guest within 200ms
- [ ] Guest heartbeat sends playback position every 2 seconds; if drift exceeds 500ms, the server forces a sync
- [ ] If either user's video buffers, playback pauses for both with a "Waiting for [Name]..." indicator
- [ ] Network disconnection triggers auto-reconnect; on reconnect, position is re-synced
- [ ] Session is cleaned up after 30 seconds of both users being disconnected
- [ ] Socket.io connection authenticates via JWT from the httpOnly cookie

**Dependencies:** Socket.io server (Phase 1), friends (3.13), video player (3.2)

#### 3.16 Emoji Reactions

**Description:** During a watch-together session, users can send emoji reactions that animate on both screens.

**Acceptance Criteria:**
- [ ] A reaction button is visible during watch-together sessions
- [ ] Press-and-hold (or click) opens a picker with 20 predefined emojis
- [ ] Selecting an emoji broadcasts it to the room via Socket.io
- [ ] The emoji appears on both screens as an animated burst: floats upward and fades out over 2 seconds
- [ ] Rate limit: maximum 1 emoji per second per user; additional presses are silently dropped
- [ ] Emoji animations do not obstruct the video center or player controls
- [ ] Animations are CSS or Framer Motion based (no GIF loading)

**Dependencies:** Watch together (3.15)

---

### P3 -- Future (Post-Launch Roadmap)

| Feature | Description | Trigger to Prioritize |
|---------|-------------|----------------------|
| HTML5 Games | Serve games from `/media/games/GameName/index.html` in a sandboxed iframe with strict CSP | Host adds game files to the library |
| Multi-User Profiles | Netflix-style profile switching within one account (household members) | Households with 3+ viewers sharing one login |
| Skip Intro | Manual marking of intro timestamps per show; player shows a "Skip Intro" button | Users complain about re-watching intros during binge sessions |
| Parental Controls | Content ratings, PIN-protected profiles, restricted mode | Households with children |
| Playback Stats Dashboard | "Your Year in Review" -- hours watched, top genres, streaks, peak times | Users express interest in personal viewing data |
| Smart Collections | Auto-generated playlists: "Short Films", "Recently Added", "Unwatched", "Family Favorites" | Library exceeds 200 titles and browsing becomes overwhelming |
| Watch Party Chat | Text chat sidebar during watch-together sessions | Users request text communication alongside video |
| Ambient Mode | Paused player background pulses with colors extracted from the current frame | Polish and delight phase |
| Media Request Board | Users request titles; admin marks fulfilled | Multiple viewers want to request content |
| Keyboard Shortcut Overlay | Press `?` to see all player shortcuts | Power users request discoverability |
| Offline Caching | Service worker caches media for local network outages | Users on flaky connections |

---

## 4. User Flows

### 4.1 First-Time User Onboarding

```
[Login Page]
    |
    v
User enters email
    |
    v
Server validates credentials --> [Error: "Invalid email or password"]
    |
    v (success)
JWT issued, cookie set
    |
    v
[Profile Setup Page]
    |
    v
User enters display name (required)
    |
    v
User uploads avatar (optional, skip available)
    |
    v
[Home Page]
    |
    v
"Welcome, [Name]" greeting displayed
    |
    v
Home page shows: Recently Added, Browse by Genre
(No Continue Watching -- no history yet)
(No Recommendations -- cold start shows genre sampler)
```

**Edge Cases:**
- User refreshes during profile setup: partial data is saved, user returns to the setup page
- User skips avatar: default initial-based avatar is used
- Display name with only whitespace: rejected with validation error
- Network failure during setup: error toast, form retains entered data

### 4.2 Browse, Discover, and Play

```
[Home Page]
    |
    v
User scrolls horizontal rows (genre rows, recommendations, continue watching)
    |
    v
User clicks a media card
    |
    v
[Media Detail Page]
    |-- Title, description, genres, year, duration
    |-- Play button (prominent)
    |-- Rating buttons (thumbs up/down)
    |-- Share button (if has friends)
    |-- Episode list (if show)
    |
    v
User clicks "Play"
    |
    v
[Video Player]
    |-- Signed URL generated, blob URL rendered
    |-- Playback position loaded (resume if returning)
    |-- Subtitle tracks loaded (if available)
    |-- Position saved every 10 seconds
    |
    v
User finishes or navigates away
    |
    v
Watch history updated, Continue Watching row reflects state
```

**Edge Cases:**
- Media file not found on disk (deleted after scan): error message "This title is currently unavailable. The library admin has been notified."
- Signed URL expires mid-playback: player transparently requests a new signed URL without interrupting playback
- Unsupported codec: HLS transcoding begins; player shows a brief "Preparing video..." spinner

### 4.3 Continue Watching

```
[Home Page]
    |
    v
Continue Watching row (first row, most prominent position)
    |-- Shows items with 5%-90% completion
    |-- Progress bar overlay on each card
    |-- For shows: displays episode info (S01E03 - Title)
    |
    v
User clicks an item
    |
    v
[Video Player] resumes from last saved position
    |
    v
Playback reaches 90%
    |
    v
Item removed from Continue Watching
    |-- If show: next episode added to Continue Watching
```

**Edge Cases:**
- User has 20+ in-progress items: row scrolls horizontally, ordered by most recently watched first
- Media is deleted from library while in Continue Watching: item silently removed on next page load
- User watches on two devices: most recent position wins (last-write-wins)

### 4.4 Search

```
[Any Page -- search bar in header]
    |
    v
User types query (minimum 1 character)
    |
    v
300ms debounce
    |
    v
FTS5 query fires
    |
    v
[Search Results Dropdown]
    |-- Up to 10 results shown inline
    |-- Each result: type icon, title, year
    |-- "View all results" link if > 10 matches
    |
    v
User clicks a result
    |
    v
[Media Detail Page]
```

**Edge Cases:**
- Query matches nothing: "No results for [query]" displayed
- Special characters in query: sanitized before FTS5 query (no SQL injection)
- Very long query (> 200 characters): truncated to 200 characters
- Network error during search: "Search unavailable. Try again." message

### 4.5 Friend Request Flow

```
[Friends Page]
    |
    v
User enters friend's email --> [POST /api/friends]
    |
    +--> Email is registered user --> Pending request created
    |       |
    |       v
    |    Recipient sees notification badge
    |       |
    |       v
    |    Recipient opens Friends page --> sees pending request
    |       |
    |       +-- Accept --> Both users are now friends
    |       +-- Reject --> Request is deleted, sender is not notified
    |
    +--> Email is NOT registered --> Pending invitation stored
            |
            v
         User signs up with that email later --> Invitation auto-fulfilled
            |
            v
         New user sees pending friend request on first login
```

**Edge Cases:**
- User sends request to themselves: rejected with error "You cannot add yourself"
- User sends duplicate request: rejected with error "Request already pending"
- User sends request to someone who blocked them: rejected with generic "Unable to send request" (does not reveal block status)
- Blocked user signs up: pending invitation is not fulfilled

### 4.6 Watch Together Flow

```
[Media Detail Page]
    |
    v
User clicks "Watch Together"
    |
    v
[Friend Selector Modal]
    |-- Lists online friends
    |-- User selects one friend
    |
    v
[POST /api/watch-sessions] --> Session created, Socket.io room opened
    |
    v
Invitation sent to friend via Socket.io
    |
    v
Friend receives real-time notification: "[Name] wants to watch [Title] with you"
    |
    +-- Friend clicks "Join" --> Joins Socket.io room, player loads
    +-- Friend declines or ignores (60s timeout) --> Session canceled
    |
    v (both joined)
[Synchronized Playback]
    |-- Host controls: play, pause, seek are broadcast
    |-- Guest sees controls grayed out (view-only) except emoji reactions
    |-- Heartbeat every 2s: drift > 500ms triggers server-forced sync
    |-- Buffering by either user pauses both
    |
    v
[Emoji Reactions]
    |-- Reaction button visible to both users
    |-- Press to open picker (20 emojis)
    |-- Selected emoji floats upward on both screens, fades over 2s
    |-- Rate limited: 1 per second per user
    |
    v
Session ends when:
    |-- Media finishes
    |-- Host ends session explicitly
    |-- Both users disconnect for > 30 seconds
```

**Edge Cases:**
- Friend is offline when invitation sent: invitation expires after 60 seconds, host is notified
- Network drop mid-session: auto-reconnect attempts for 30 seconds, position re-syncs on success
- Host disconnects: guest is paused with "Waiting for host to reconnect..." message
- Guest disconnects: host continues playing; guest re-syncs on reconnect
- Incompatible media (e.g., music): "Watch Together" button is hidden for non-video content

### 4.7 Admin Metadata Management Flow

```
[Admin Page] (admin role required)
    |
    v
[Media Table]
    |-- Searchable, sortable list of all media
    |-- Columns: thumbnail, title, type, genres, year, last modified
    |
    v
Admin clicks a row
    |
    v
[Edit Form]
    |-- Title (text input, required)
    |-- Description (textarea)
    |-- Genres (tag input, add/remove)
    |-- Keywords (tag input, add/remove)
    |-- Year (number input, 4 digits)
    |-- Poster (image upload, JPEG/PNG)
    |
    v
Admin edits fields and clicks "Save"
    |
    v
[PATCH /api/admin/media/:id] --> DB updated
    |
    v
Success toast: "Metadata saved for [Title]"
    |
    v
Public-facing UI reflects changes immediately (no re-scan needed)
```

**Edge Cases:**
- Non-admin user navigates to `/admin`: redirected to home page with no error (do not reveal admin routes exist)
- Admin uploads a poster larger than 5MB: rejected with "Poster must be under 5MB"
- Admin clears the title field: validation error "Title is required"
- Two admins edit the same item simultaneously: last write wins, no conflict resolution needed for private scale

---

## 5. Non-Functional Requirements

### 5.1 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Home page load (localhost, 500+ titles) | < 2 seconds | Time from navigation to largest contentful paint |
| Video playback start (H.264 mp4, localhost) | < 3 seconds | Time from play click to first frame rendered |
| Search results (FTS5, 1000+ titles) | < 500ms | Time from debounce trigger to results rendered |
| API response time (95th percentile) | < 200ms | Server-side measurement, excluding media streaming |
| Media scan (1000 files) | < 10 minutes | End-to-end scan including thumbnail generation |
| WebSocket message latency (watch-together) | < 200ms | Time from host action to guest receiving event |
| Image lazy loading | Below-fold images load on scroll | No images below the fold load on initial page render |

### 5.2 Security Requirements

| Requirement | Implementation | Verification |
|-------------|---------------|--------------|
| No raw media URLs exposed | Signed URLs with HMAC-SHA256, 1-hour expiry; blob URL rendering | Inspect DOM and Network tab: no direct file paths visible |
| Anti-download measures | Disable right-click on player, block Ctrl+S, CSP blocks data extraction | Right-click shows no "Save" option; Ctrl+S does nothing on player page |
| Content Security Policy | Strict CSP headers: no inline scripts, no eval, restricted connect-src | CSP violations logged; Lighthouse reports no CSP issues |
| HTTP security headers | X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin | Headers present on all responses (verify via curl) |
| Rate limiting | Per-endpoint rate limits; aggressive on auth (5 attempts per minute), moderate on API (100 requests per minute) | Exceeding limit returns 429 with Retry-After header |
| CORS | Restrict to frontend origin only | Cross-origin requests from other domains are rejected |
| Input sanitization | All user input sanitized before database insertion and rendering | No stored XSS possible; SQL injection returns error, not data |
| JWT security | httpOnly, Secure, SameSite=Strict cookies; no token in URL or localStorage | Token not accessible via document.cookie in browser console |
| Auth bypass testing | All protected endpoints return 401 without valid JWT | Automated test suite verifies every protected route |
| Iframe sandboxing (games) | Games served in sandboxed iframe with `sandbox="allow-scripts"` and strict CSP | Game iframe cannot access parent DOM or make network requests outside its origin |

### 5.3 Accessibility (WCAG 2.1 AA)

| Requirement | Verification |
|-------------|--------------|
| All interactive elements are keyboard navigable | Tab through every page; all buttons, links, and inputs are reachable and activatable |
| Focus management on route changes | Focus moves to main content on navigation; no focus trap in modals unless intentional |
| ARIA labels on all non-text interactive elements | Screen reader audit: every button, icon, and input has a descriptive label |
| Color contrast ratios meet 4.5:1 (normal text) and 3:1 (large text) | Axe or Lighthouse accessibility audit passes |
| Video player controls are accessible | Play, pause, seek, volume, fullscreen, and subtitle controls are all keyboard-operable and labeled |
| Skip navigation link | First Tab press on any page reveals a "Skip to main content" link |
| Alt text on all images | All `<img>` tags have descriptive alt attributes; decorative images have `alt=""` |
| Reduced motion support | `prefers-reduced-motion` media query disables animations (emoji bursts, transitions) |

### 5.4 Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | Latest 2 major versions | Primary development target |
| Firefox | Latest 2 major versions | |
| Safari | Latest 2 major versions | PiP uses native Safari API; test HLS native support |
| Edge | Latest 2 major versions | Chromium-based; expected to match Chrome behavior |

### 5.5 Mobile Support

| Requirement | Verification |
|-------------|--------------|
| Responsive layout from 320px to 2560px viewport width | Visual inspection at 320px, 375px, 768px, 1024px, 1440px, 2560px |
| Touch gestures on video player | Swipe left/right to seek (10s increments), double-tap left/right to skip (30s) |
| PWA manifest for home screen installation | "Add to Home Screen" prompt works on Chrome Android and Safari iOS |
| Bottom navigation bar on mobile | Nav bar is at bottom of screen on viewports below 768px |
| No horizontal overflow on any page at mobile widths | No unintended horizontal scroll on any page at 320px width |

### 5.6 Offline Resilience

| Scenario | Behavior |
|----------|----------|
| Server unreachable during browsing | Toast notification: "Connection lost. Retrying..." with exponential backoff |
| Server unreachable during playback | Buffered content continues playing; playback pauses when buffer exhausts with "Reconnecting..." overlay |
| Server unreachable during watch-together | Auto-reconnect attempts for 30 seconds; session preserved on server for 30 seconds |
| API request fails | Retry up to 3 times with exponential backoff (1s, 2s, 4s); then show error state |
| Service worker (PWA) | Caches static assets (JS, CSS, images) for instant shell load even when server is down; media is not cached |

---

## 6. Content Management

### 6.1 Media Directory Structure

```
media/
  movies/
    MovieTitle (Year)/
      MovieTitle.mp4
      metadata.json          (optional sidecar)
      poster.jpg             (optional custom poster)
  shows/
    ShowName/
      metadata.json          (show-level metadata)
      poster.jpg             (show poster)
      Season 01/
        S01E01 - Episode Title.mp4
        S01E02 - Episode Title.mp4
        metadata.json        (optional episode-level overrides)
      Season 02/
        S02E01 - Episode Title.mp4
  music/
    ArtistName/
      AlbumName/
        01 - TrackTitle.mp3
        cover.jpg            (album art)
        metadata.json
  games/
    GameName/
      index.html             (entry point, required)
      game.js
      assets/
```

**Conventions:**
- Movie folders: `Title (Year)/` format preferred but not required
- Show episodes: `S01E01 - Title.ext` format is parsed for season and episode numbers
- Season folders: `Season 01`, `Season 02`, etc.
- Music tracks: `## - Title.ext` format is parsed for track number
- Games: must contain an `index.html` at the game root

### 6.2 Metadata Sidecar Format (metadata.json)

```json
{
  "title": "Dune: Part Two",
  "description": "Paul Atreides unites with the Fremen to wage war against House Harkonnen.",
  "genres": ["sci-fi", "action", "drama"],
  "keywords": ["desert", "prophecy", "sandworm", "rebellion"],
  "year": 2024,
  "poster": "poster.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No (falls back to filename) | Display title |
| `description` | string | No | Synopsis or description (max 2000 characters) |
| `genres` | string[] | No | Array of genre tags (lowercase, hyphenated) |
| `keywords` | string[] | No | Array of keyword tags for search and recommendations |
| `year` | number | No | Release year (4-digit integer) |
| `poster` | string | No | Relative path to poster image (JPEG/PNG, relative to the metadata.json location) |

**For shows (show-level metadata.json):**
All fields above apply to the show as a whole. Episodes inherit show-level genres and keywords.

**For episodes (season-level metadata.json):**
```json
{
  "episodes": {
    "S01E01": { "title": "Pilot", "description": "The story begins." },
    "S01E02": { "title": "The Search", "description": "The search intensifies." }
  }
}
```

### 6.3 Subtitle File Conventions

**Location:** `/subtitles/` directory at the project root.

**Naming Convention:**
- Movies: `{media-slug}.{language-code}.{vtt|srt}`
- Episodes: `{show-slug}.s01e01.{language-code}.{vtt|srt}`

**Examples:**
- `dune-part-two.en.vtt`
- `dune-part-two.es.srt`
- `breaking-bad.s01e01.en.vtt`
- `breaking-bad.s01e01.de.srt`

**Supported Formats:**
| Format | Extension | Notes |
|--------|-----------|-------|
| WebVTT | `.vtt` | Preferred. Native HTML5 support. Served directly. |
| SubRip | `.srt` | Supported. Auto-converted to VTT at serve time by the backend. |

**Language Codes:** ISO 639-1 two-letter codes (en, es, fr, de, ja, ko, zh, etc.)

**Slug Generation:** Lowercase, spaces and special characters replaced with hyphens, consecutive hyphens collapsed. Example: "Dune: Part Two" becomes "dune-part-two".

### 6.4 Admin UI for Metadata Editing

See feature 3.12 (Admin Metadata UI) for full acceptance criteria. The admin UI is the web-based interface for editing metadata after the initial scan. It does not modify files on disk; the database becomes the source of truth once a scan has been performed.

### 6.5 Supported Media Formats

| Category | Formats | Playback Method |
|----------|---------|-----------------|
| Video | `.mp4`, `.mkv`, `.avi`, `.webm`, `.mov` | H.264/AAC via direct HTTP 206 streaming; other codecs via on-demand HLS transcoding |
| Audio | `.mp3`, `.flac`, `.aac`, `.ogg`, `.wav` | HTML5 `<audio>` element with persistent mini-player |
| Games | HTML5 (`.html` entry point) | Sandboxed `<iframe>` with strict CSP |
| Subtitles | `.vtt`, `.srt` | VTT native; SRT auto-converted to VTT |
| Images (posters) | `.jpg`, `.jpeg`, `.png` | Standard `<img>` elements |

**Codec Notes:**
- H.264 video with AAC audio in an MP4 container is the "fast path" -- served directly without transcoding
- All other video codecs (H.265, VP8, VP9, AV1) trigger on-demand HLS transcoding via ffmpeg
- Transcoded segments are cached in `/data/hls-cache/` to avoid re-transcoding on subsequent plays
- ffmpeg and ffprobe must be installed on the server (checked at startup with a clear error message if missing)

---

## 7. Metrics and Analytics (Local Only)

All analytics data is stored in the local SQLite database. No data is sent to any external analytics service, tracking pixel, or telemetry endpoint. This is a non-negotiable privacy guarantee.

### 7.1 Per-User Tracking

| Metric | Storage | Purpose |
|--------|---------|---------|
| Watch history | `watch_history` table: user_id, media_id, episode_id, position, duration, started_at, updated_at, status (in_progress/completed) | Continue Watching, recommendations, stats |
| Completion rate | Derived: position / duration at session end | Measure content engagement quality |
| Genre preferences | Derived: aggregate genres from watched + rated items | Power recommendation engine |
| Ratings | `user_ratings` table: user_id, media_id, rating (up/down), created_at | Recommendation scoring, taste profile |
| Search queries | `search_log` table: user_id, query, result_count, clicked_result_id, timestamp | Identify content gaps, improve search ranking |
| Friend activity | `friends` and `recommendations` tables | Social engagement metrics |
| Session activity | Login timestamps, session durations (derived from watch history gaps) | WAU/DAU calculations |

### 7.2 Global Tracking

| Metric | Derivation | Purpose |
|--------|------------|---------|
| Popular titles (7-day, 30-day) | Ranked by unique viewers in time window | "Popular on Blockbuster" row |
| Active users (daily, weekly, monthly) | Distinct user IDs with watch history entries in period | Health metric |
| Peak usage times | Aggregate watch session start times by hour-of-day and day-of-week | Curiosity / potential "busy server" indicator |
| Library size over time | Count of media entries per scan | Growth tracking |
| Search-to-play funnel | Searches with a subsequent play event within 5 minutes | Search effectiveness |
| Recommendation effectiveness | Recommended items that are subsequently played | Recommendation algorithm tuning |
| Watch-together usage | Session count, average duration, emoji count per session | Social feature adoption |

### 7.3 Event Taxonomy

All events follow the `{noun}_{verb}` naming convention in past tense.

| Event Name | Properties | Trigger |
|------------|------------|---------|
| `media_played` | media_id, media_type, source (browse/search/continue/recommendation) | User starts playback |
| `media_completed` | media_id, media_type, duration_watched, total_duration | Playback reaches 90% |
| `media_abandoned` | media_id, media_type, position, total_duration | User navigates away before 90% |
| `media_searched` | query, result_count | Search debounce fires |
| `media_rated` | media_id, rating (up/down/removed) | User clicks rating button |
| `recommendation_clicked` | media_id, recommendation_source (personal/friend/because_watched) | User clicks a recommended item |
| `recommendation_shared` | media_id, recipient_user_id | User shares a recommendation |
| `friend_requested` | recipient_email | User sends a friend request |
| `friend_accepted` | requester_user_id | User accepts a friend request |
| `session_created` | media_id, invited_user_id | Watch-together session created |
| `session_joined` | session_id | User joins a watch-together session |
| `emoji_sent` | session_id, emoji | User sends an emoji reaction |
| `scan_completed` | files_found, files_added, files_updated, files_removed, duration_ms | Media scan finishes |

### 7.4 Analytics Queries (Admin Dashboard -- P3)

When the stats dashboard is built, these are the key views:

- **User dashboard:** Hours watched this week/month/year, top 5 genres, longest streak, most re-watched title
- **Admin dashboard:** Total library size, WAU trend, most popular titles, search queries with zero results (content gaps), scan history
- **Recommendation health:** Click-through rate by source, recommendation diversity score

All queries run against SQLite. No materialized views needed at private scale (< 50 users, < 5000 titles).

---

## 8. Launch Checklist

### 8.1 Phase-by-Phase Verification

#### Phase 1: Infrastructure
- [ ] `npm run dev` starts both frontend (port 3000) and backend (port 4000)
- [ ] `curl localhost:4000/api/health` returns `{"status":"ok"}`
- [ ] Frontend loads at `http://localhost:3000` without errors
- [ ] SQLite database is created at `/data/blockbuster.db` with all tables
- [ ] FTS5 virtual table exists and accepts INSERT/SELECT
- [ ] Security headers present on all responses (CSP, X-Frame-Options, etc.)
- [ ] `/media/{movies,shows,music,games}`, `/subtitles`, `/data` directories exist

#### Phase 2: Media Library
- [ ] Drop 5+ MP4 files in `/media/movies/` with `metadata.json` sidecars
- [ ] `POST /api/media/scan` completes without errors
- [ ] All scanned media appears on the home page with thumbnails
- [ ] Media detail page shows all metadata fields
- [ ] Search returns relevant results for title, genre, and keyword queries
- [ ] Admin UI lists all media and allows metadata editing
- [ ] Edited metadata appears on the public detail page without re-scan
- [ ] Show folder structure is correctly parsed into seasons and episodes

#### Phase 3: Playback
- [ ] H.264 MP4 plays via direct streaming (no transcoding)
- [ ] Seeking works without re-buffering the entire file
- [ ] Signed URLs expire after 1 hour (verify by replaying an old URL)
- [ ] No raw file path visible in DOM or Network tab
- [ ] Right-click on video player does not offer "Save video as"
- [ ] Subtitles display when available; language selector works
- [ ] Fullscreen, PiP, and half-screen modes all work
- [ ] Music plays with mini-player that persists across navigation
- [ ] Show episode auto-advance triggers after episode completion

#### Phase 4: Auth and Users
- [ ] Login with valid email succeeds; invalid email shows error
- [ ] Protected routes return 401 without JWT
- [ ] `SKIP_AUTH=true` disables all auth checks
- [ ] Profile name and avatar can be set and persist across sessions
- [ ] Watch history is recorded every 10 seconds during playback
- [ ] Continue Watching row appears with in-progress items
- [ ] Resuming from Continue Watching starts at the correct position
- [ ] Rating a title persists and is reflected in the UI

#### Phase 5: Recommendations
- [ ] New user with no history sees "Recently Added" and genre sampler
- [ ] After watching and rating 3+ titles, "Recommended For You" row appears
- [ ] "Because You Watched [Title]" rows show related content
- [ ] Recommendations update after new ratings or watches

#### Phase 6: Social
- [ ] Friend request can be sent by email
- [ ] Request to unregistered email is stored and fulfilled on signup
- [ ] Accept/reject works; accepted friends appear in both friend lists
- [ ] Share recommendation sends media + message to friend
- [ ] Friend's inbox shows unread recommendation with badge
- [ ] "Friends Recommend" row appears on home page

#### Phase 7: Watch Together
- [ ] Create session, invite friend, friend receives notification
- [ ] Host play/pause/seek is mirrored on guest within 200ms
- [ ] Drift correction fires when positions diverge > 500ms
- [ ] Buffering by either user pauses both
- [ ] Disconnect + reconnect re-syncs position
- [ ] Emoji reactions appear on both screens with animation
- [ ] Emoji rate limit enforced (1/second)
- [ ] Session cleans up after 30s of full disconnect

#### Phase 8: Polish and Security
- [ ] Games load in sandboxed iframe; cannot access parent DOM
- [ ] OWASP Top 10 audit passes (injection, auth bypass, CSRF, etc.)
- [ ] All inputs are sanitized (test with XSS payloads and SQL injection strings)
- [ ] Rate limits are enforced on auth (5/min) and API (100/min)
- [ ] Lighthouse accessibility score > 90
- [ ] Lighthouse performance score > 90
- [ ] PWA install works on Chrome Android and Safari iOS
- [ ] Touch gestures work on video player (swipe seek, double-tap skip)

### 8.2 Security Audit Checklist

| Category | Check | Pass Criteria |
|----------|-------|---------------|
| Authentication | Expired JWT is rejected | 401 response, not stale data |
| Authentication | JWT cannot be forged | Modified token payload returns 401 |
| Authentication | Refresh token rotation | Old refresh token is invalidated after use |
| Authorization | Non-admin cannot access `/api/admin/*` | 403 response |
| Authorization | User A cannot access User B's watch history | API returns only own data |
| Injection | SQL injection in search | FTS5 query is parameterized; injection returns error or empty results |
| Injection | XSS in display name | HTML entities are escaped in all rendering contexts |
| Injection | XSS in metadata fields | Description, genres, keywords are escaped |
| Transport | No media URL leaks file path | Network tab shows signed URL only; no `/media/` path exposed |
| Transport | HTTPS enforced (production) | HTTP redirects to HTTPS; HSTS header present |
| Headers | CSP blocks inline scripts | Inline `<script>` tags do not execute |
| Headers | X-Frame-Options prevents framing | Page cannot be loaded in an iframe from another origin |
| Rate Limiting | Auth endpoint rate limited | 6th login attempt within 1 minute returns 429 |
| Rate Limiting | API endpoint rate limited | 101st request within 1 minute returns 429 |
| WebSocket | Socket.io requires valid JWT | Connection without cookie is rejected |
| Games | Game iframe is sandboxed | `sandbox` attribute present; game cannot access parent window |

### 8.3 Cross-Device Testing Matrix

| Device Category | Specific Targets | Test Scope |
|-----------------|-----------------|------------|
| Desktop Chrome (Windows) | Latest, Latest-1 | Full feature set |
| Desktop Chrome (macOS) | Latest, Latest-1 | Full feature set |
| Desktop Firefox (Windows) | Latest, Latest-1 | Full feature set, PiP fallback |
| Desktop Safari (macOS) | Latest, Latest-1 | Full feature set, native HLS, PiP |
| Desktop Edge (Windows) | Latest, Latest-1 | Full feature set |
| Mobile Chrome (Android) | Pixel 7 or equivalent, latest Chrome | Touch gestures, PWA install, bottom nav |
| Mobile Safari (iOS) | iPhone 14 or equivalent, latest Safari | Touch gestures, PWA install, bottom nav, HLS native |
| Tablet Safari (iPad) | iPad Air or equivalent | Responsive layout at 768px-1024px, split view |
| Low-bandwidth simulation | Chrome DevTools, "Slow 3G" throttle | Page loads, video buffering behavior, graceful degradation |

**Test Procedure per Device:**
1. Login and complete profile setup
2. Browse home page, verify layout and row scrolling
3. Search for a title, verify results
4. Play a video, verify playback and controls
5. Verify Continue Watching after partial play
6. Test subtitles (if available)
7. Test fullscreen and PiP modes
8. Test friend request flow (if second device available)
9. Test watch-together (if second device available)
10. Test PWA install (mobile only)

---

## Appendix A: Out of Scope (Explicit Exclusions)

The following are explicitly NOT part of Blockbuster and should not be built:

- **User registration (self-serve):** Users are created by the admin or via Cloudflare Access. There is no public sign-up page.
- **External metadata fetching:** No calls to TMDB, IMDB, or any external API. All metadata comes from sidecar files or admin input.
- **AI/ML features:** No LLM-based recommendations, no AI-generated descriptions, no voice commands.
- **Payment or subscription:** No monetization of any kind.
- **External analytics:** No Google Analytics, Mixpanel, Segment, or any third-party tracking.
- **Native mobile apps:** Mobile is served via responsive web and PWA only.
- **Multi-server federation:** Blockbuster runs on one server. There is no discovery or federation protocol.
- **DRM:** Content protection relies on signed URLs and anti-download measures, not DRM encryption.
- **Live streaming:** All media is pre-recorded files. No RTMP, no webcam, no live broadcast.
- **Transcoding queue management:** Transcoding is on-demand and synchronous. There is no persistent queue or priority system.

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| Host | The user who owns the server, manages the media library, and administers the system |
| Viewer | An invited user who browses and watches content |
| Sidecar | A `metadata.json` file placed alongside media files to provide title, description, and other metadata |
| FTS5 | SQLite Full-Text Search extension, version 5 |
| HLS | HTTP Live Streaming -- adaptive bitrate protocol used for transcoded media |
| Signed URL | A URL with an HMAC-SHA256 signature and expiry timestamp, used to prevent unauthorized direct access to media files |
| Blob URL | A browser-generated URL (`blob:...`) that references in-memory data, hiding the actual source URL from the DOM |
| Watch-together session | A synchronized playback session between two users with real-time control sharing |
| Cold start | The state when a new user has no watch history or ratings, requiring fallback recommendation logic |
| Media slug | A URL-safe, lowercase, hyphenated version of a media title used for subtitle file matching |
