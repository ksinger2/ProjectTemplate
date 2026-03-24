# Blockbuster Screen Specifications

Version 1.0 -- Last updated 2026-03-23

Each screen includes ASCII wireframes for desktop and mobile, a component inventory, key interactions, and state coverage.

---

## 1. Login Page

### Purpose
Single entry point. Email-only authentication (no password -- auth handled via Cloudflare Access in production, JWT-based in dev).

### Desktop Wireframe
```
+------------------------------------------------------------------+
|                                                                    |
|                     (cinematic dark background)                    |
|                                                                    |
|                                                                    |
|                        +-----------------+                         |
|                        |   BLOCKBUSTER   |                         |
|                        |     [logo]      |                         |
|                        +-----------------+                         |
|                                                                    |
|                    +------------------------+                      |
|                    | Email address           |                      |
|                    +------------------------+                      |
|                                                                    |
|                    [    Sign In    ]  (red btn)                     |
|                                                                    |
|                    Private streaming for                            |
|                    invited members only.                            |
|                                                                    |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile Wireframe
```
+---------------------+
|                     |
| (cinematic bg)      |
|                     |
|    BLOCKBUSTER      |
|      [logo]         |
|                     |
| +------------------+|
| | Email address    ||
| +------------------+|
|                     |
| [    Sign In      ] |
|                     |
| Private streaming   |
| for invited members |
| only.               |
|                     |
+---------------------+
```

### Component Inventory
- NavBar: hidden on this page
- Input field (email): `base` size, `--bb-surface` bg, `--bb-border` border
- Button (primary): full-width, `--bb-accent` bg, white text, semibold
- Logo: centered, 48px height
- Background: full-bleed dark image or gradient

### Key Interactions
- Enter key submits form
- Invalid email: inline error below input, red border, "Please enter a valid email"
- Success: redirect to Home with fade transition
- Server error: inline error "Something went wrong. Try again."

### States

| State       | Description                                             |
|-------------|-------------------------------------------------------- |
| Default     | Empty email input, Sign In button disabled (muted)      |
| Typing      | Input focused, blue-ish glow removed -- use white border|
| Valid email | Sign In button enabled (`--bb-accent`)                  |
| Loading     | Button shows spinner, input disabled                    |
| Error       | Red border on input, error message below                |
| Success     | Brief checkmark, then redirect                          |

---

## 2. Home Page

### Purpose
Netflix-style browse experience. Hero banner, personalized rows, genre browsing.

### Desktop Wireframe
```
+------------------------------------------------------------------+
| [Logo]  Home Shows Movies Music Games       [Search] [Avatar]     |  <- NavBar (transparent)
+------------------------------------------------------------------+
|                                                                    |
|  HERO BANNER (70vh)                                                |
|  +---------------------------------------------------------+      |
|  |                                                         |      |
|  |  Featured Title                                         |      |
|  |  2024  |  2h 15m  |  Action, Sci-Fi                     |      |
|  |  Description text two lines max lorem ipsum              |      |
|  |  dolor sit amet consectetur...                           |      |
|  |                                                         |      |
|  |  [ Play ]  [ More Info ]                                 |      |
|  |                                                         |      |
|  +---------------------------------------------------------+      |
|  (gradient fade to #141414)                                        |
|                                                                    |
|  Continue Watching                                                 |
|  [<] [Card+prog] [Card+prog] [Card+prog] [Card+prog] [Card] [>]  |
|                                                                    |
|  Recommended For You                                               |
|  [<] [Card] [Card] [Card] [Card] [Card] [Card] [>]                |
|                                                                    |
|  Because You Watched "Dune"                                        |
|  [<] [Card] [Card] [Card] [Card] [Card] [Card] [>]                |
|                                                                    |
|  Friends Recommend                                                 |
|  [<] [Card] [Card] [Card] [Card] [Card] [Card] [>]                |
|                                                                    |
|  Recently Added                                                    |
|  [<] [Card] [Card] [Card] [Card] [Card] [Card] [>]                |
|                                                                    |
|  Action & Adventure                                                |
|  [<] [Card] [Card] [Card] [Card] [Card] [Card] [>]                |
|                                                                    |
|  (more genre rows...)                                              |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile Wireframe
```
+---------------------+
| [Logo]    [S] [Av]  |  <- NavBar
+---------------------+
|                     |
| HERO (50vh)         |
| +-----------------+ |
| |                 | |
| | Featured Title  | |
| | 2024 | 2h 15m   | |
| |                 | |
| | [Play] [Info]   | |
| +-----------------+ |
| (gradient)          |
|                     |
| Continue Watching   |
| [Card] [Card] [C>  |
|                     |
| Recommended         |
| [Card] [Card] [C>  |
|                     |
| Recently Added      |
| [Card] [Card] [C>  |
|                     |
| Action              |
| [Card] [Card] [C>  |
|                     |
+-----  BottomNav  ---+
| Home Search Fr Prof |
+---------------------+
```

### Component Inventory
- NavBar (transparent, scrolls to blurred bg)
- Hero banner (backdrop image, gradient overlays, title block, CTA buttons)
- MediaRow (multiple instances)
- ContinueWatchingCard (in Continue Watching row)
- MediaCard (in all other rows)
- BottomNav (mobile only)
- MiniPlayer (if music playing, above BottomNav)

### Key Interactions
- Hero "Play" button: navigates directly to Player
- Hero "More Info" button: navigates to Media Detail
- Scroll rows horizontally with arrows or touch/trackpad
- Click any card: navigate to Media Detail
- NavBar becomes opaque on scroll (after ~100px)
- Hero auto-rotates featured titles every 8s (pauses on hover)

### States

| State            | Description                                         |
|------------------|-----------------------------------------------------|
| Default          | Full content loaded. Hero with random featured pick. |
| Loading          | Skeleton hero (gradient shimmer). Skeleton rows.     |
| Empty library    | Hero area shows welcome message: "Your library is empty. Add media files to get started." No rows visible. |
| New user         | No Continue Watching. No recommendations. Show Recently Added and genre rows only. Welcome greeting: "Welcome, [Name]!" |
| Returning user   | "Welcome back, [Name]!" greeting above first row. Continue Watching appears if applicable. |
| Music playing    | MiniPlayer bar visible at bottom.                   |
| Error            | Full-page error with retry button.                  |

---

## 3. Media Detail Page

### Purpose
Full metadata view for a single title. Play button, episode list (shows), similar titles, social actions.

### Desktop Wireframe
```
+------------------------------------------------------------------+
| [Logo]  Home Shows Movies Music Games       [Search] [Avatar]     |
+------------------------------------------------------------------+
|                                                                    |
|  BACKDROP (50vh)                                                   |
|  +---------------------------------------------------------+      |
|  |                                                         |      |
|  |  left-fade gradient                                     |      |
|  |                                                         |      |
|  |  Movie Title                                            |      |
|  |  2024  |  PG-13  |  2h 15m  |  Action, Sci-Fi          |      |
|  |                                                         |      |
|  |  [ Play ]  [ thumbs-up ]  [ thumbs-down ]  [ Share ]    |      |
|  |                                                         |      |
|  +---------------------------------------------------------+      |
|  (gradient fade)                                                   |
|                                                                    |
|  Description text here. Can be multiple lines. Full paragraph      |
|  of the movie or show description without truncation on this       |
|  detail view.                                                      |
|                                                                    |
|  Genres: Action  Sci-Fi  Drama       (pill tags)                   |
|  Keywords: desert, prophecy          (secondary tags)              |
|                                                                    |
|  --- (divider, shows only) ---------------------------------       |
|                                                                    |
|  Episodes                                                          |
|  Season 1 | Season 2 | Season 3                                    |
|  +-------------------------------------------------------+        |
|  | [Thumb]  1. Pilot                              45m    |        |
|  |          The story begins when...                     |        |
|  +-------------------------------------------------------+        |
|  | [Thumb]  2. The Discovery                      42m    |        |
|  |          Our heroes find something...                 |        |
|  +-------------------------------------------------------+        |
|                                                                    |
|  --- (divider) --------------------------------------------        |
|                                                                    |
|  More Like This                                                    |
|  [<] [Card] [Card] [Card] [Card] [Card] [Card] [>]                |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile Wireframe
```
+---------------------+
| [<Back]    [S] [Av] |
+---------------------+
|                     |
| BACKDROP (40vh)     |
| +-----------------+ |
| |                 | |
| | Movie Title     | |
| | 2024 | 2h 15m   | |
| +-----------------+ |
| (gradient)          |
|                     |
| [    Play    ]      |
| [up] [down] [share] |
|                     |
| Description text    |
| full paragraph no   |
| truncation here...  |
|                     |
| Genres: chips       |
|                     |
| --- Episodes ---    |
| [S1] [S2] [S3]     |
| +------------------+|
| |[Th] 1. Pilot 45m||
| |     Desc...      ||
| +------------------+|
| |[Th] 2. Disc. 42m||
| |     Desc...      ||
| +------------------+|
|                     |
| More Like This      |
| [Card] [Card] [C>  |
|                     |
+-----  BottomNav  ---+
```

### Component Inventory
- NavBar (with back button on mobile)
- Hero/backdrop (large background image with gradient overlays)
- RatingButtons (thumbs up/down)
- Share button (opens friend picker or native share sheet on mobile)
- Genre/keyword pill tags: `radius-full`, `--bb-elevated` bg, sm text
- EpisodeList (shows only)
- MediaRow ("More Like This")

### Key Interactions
- "Play" starts playback (resumes from last position if watch history exists)
- Rating buttons toggle (see RatingButtons spec)
- Share opens a modal/sheet to pick a friend and add optional message
- Episode click starts playback of that episode
- Season tabs switch episode list
- Scroll to episodes section on shows

### States

| State          | Description                                          |
|----------------|------------------------------------------------------|
| Default        | Full metadata, poster/backdrop, description.         |
| Movie          | No episode list section.                             |
| TV Show        | Episode list visible with season tabs.               |
| Music album    | Track list instead of episodes. Play starts album.   |
| Game           | "Launch Game" button instead of Play. No episodes.   |
| Loading        | Backdrop skeleton shimmer. Text skeleton lines.      |
| No backdrop    | Solid `--bb-surface` background with poster only.    |
| No description | Description section hidden. Rest of layout shifts up.|
| Shared by friend| "Recommended by [Friend]" badge above title.        |

---

## 4. Player Page

### Purpose
Full video/audio playback with controls, subtitle support, video modes, emoji reactions, and watch-together sync.

### Desktop Wireframe (controls visible)
```
+------------------------------------------------------------------+
| [<-]  Movie Title - Episode Name                [Cast][PiP][Full] |
|                                                                    |
|                                                                    |
|                                                                    |
|                                                                    |
|                   [<< 10s]  [ PLAY ]  [>> 10s]                     |
|                                                                    |
|                                                                    |
|                                                                    |
|                                                                    |
|  [========================================---------------------]   |
|  1:23:45               [CC] [Settings] [Emoji]  [Vol ==]  2:15:00 |
+------------------------------------------------------------------+
```

### Desktop Wireframe (half-screen mode)
```
+------------------------------------------------------------------+
| [<-]  Movie Title                               [Cast][PiP][Full] |
|                                                                    |
|                   [VIDEO - top 50vh]                                |
|                                                                    |
|  [========================================-----]                   |
|  1:23:45               [CC] [Set] [Emo] [Vol]            2:15:00  |
+------------------------------------------------------------------+
|                                                                    |
|  (scrollable page content below: description, episodes, etc.)      |
|                                                                    |
+------------------------------------------------------------------+
```

### Desktop Wireframe (watch together with emoji burst)
```
+------------------------------------------------------------------+
|  [<-]  Movie Title                  Watching with: [Av] Karen     |
|                                                                    |
|                                                                    |
|                              *                                     |
|                         *   heart   *                              |
|                              *                                     |
|                   [<< 10s]  [ PLAY ]  [>> 10s]                     |
|                                                                    |
|                                                                    |
|  [========================================---------------------]   |
|  1:23:45               [CC] [Set] [Emoji] [Vol]          2:15:00  |
+------------------------------------------------------------------+
```

### Mobile Wireframe (landscape)
```
+-----------------------------------------------+
| [<]  Title              [CC][PiP][Full]        |
|                                                |
|           [<<]  [PLAY]  [>>]                   |
|                                                |
| [=================================---]         |
| 1:23:45          [Emoji] [Vol]     2:15:00     |
+-----------------------------------------------+
```

### Component Inventory
- PlayerControls (full spec in design system)
- EmojiPicker (press-and-hold trigger)
- Emoji burst animation layer
- Subtitle renderer (WebVTT cues positioned bottom-center)
- Buffering spinner
- Next episode auto-play overlay (appears 10s before end)
- Watch-together participant indicator

### Key Interactions
- Click/tap video area: toggle play/pause
- Mouse move / tap: show controls for 3s
- Double-tap left/right (mobile): skip 10s
- Press-and-hold emoji button: open picker
- Subtitle button: toggle CC menu
- PiP button: enter picture-in-picture
- Fullscreen button: toggle fullscreen
- Back arrow: return to detail page (with confirmation if watch-together)
- Next episode overlay: countdown auto-advances, or click "Next Episode" / "Cancel"
- Keyboard shortcuts: Space (play/pause), F (fullscreen), M (mute), arrows (seek/volume)

### States

| State              | Description                                          |
|--------------------|------------------------------------------------------|
| Playing            | Video streams. Controls auto-hide after 3s.          |
| Paused             | Controls stay visible. Play icon shown.              |
| Buffering          | Spinner center-screen. Controls visible.             |
| Controls visible   | All controls shown with semi-transparent bg.         |
| Controls hidden    | Clean video view. Cursor hidden.                     |
| Fullscreen         | Browser fullscreen. Controls overlay.                |
| Half-screen        | Video in top 50vh. Page content scrolls below.       |
| PiP                | Small draggable window in corner. Main page navigable.|
| Subtitles on       | Cue text at bottom-center. White text, dark shadow.  |
| Watch-together     | Participant badge in top bar. Controls sync to host.  |
| Emoji burst        | Emoji animates upward and fades. Visible to all.     |
| Next episode       | Overlay: "Next: Episode Title" with 10s countdown.   |
| End of content     | "Play Again" button and "More Like This" suggestions.|
| Error              | "Playback error. Try again." with retry button.      |
| Offline            | "You appear to be offline." message.                 |

---

## 5. Search Results Page

### Purpose
Full search experience with results grid and type/genre filters.

### Desktop Wireframe
```
+------------------------------------------------------------------+
| [Logo]  Home Shows Movies Music Games       [Search] [Avatar]     |
+------------------------------------------------------------------+
|                                                                    |
|  +---------------------------------------------------+            |
|  | [magnifier] Search for titles, genres, people...   |  [X]      |
|  +---------------------------------------------------+            |
|                                                                    |
|  Filters: [All] [Movies] [Shows] [Music] [Games]                  |
|                                                                    |
|  Results for "dune"  (12 results)                                  |
|                                                                    |
|  [Card] [Card] [Card] [Card] [Card] [Card]                        |
|  [Card] [Card] [Card] [Card] [Card] [Card]                        |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile Wireframe
```
+---------------------+
| [<] Search          |
+---------------------+
| +------------------+|
| | Search...        ||
| +------------------+|
|                     |
| [All][Mov][Show][Mu]|
|                     |
| "dune" (12 results) |
|                     |
| [Card]  [Card]      |
| [Card]  [Card]      |
| [Card]  [Card]      |
| [Card]  [Card]      |
|                     |
+-----  BottomNav  ---+
```

### Component Inventory
- NavBar
- Search input (full-width variant, always expanded on this page)
- Filter chips: `radius-full`, `--bb-elevated` bg, active: `--bb-accent` bg
- MediaCard (grid layout, not scroll row)
- BottomNav (mobile)

### Key Interactions
- Auto-focus search input on page load
- Debounced search: 300ms after typing stops
- Filter chips: toggle to filter results by media type
- Click card: navigate to Media Detail
- Clear button (X): clears search, shows trending/recent
- Empty query: show "Trending" or "Browse by Genre" grid

### States

| State          | Description                                         |
|----------------|-----------------------------------------------------|
| Empty query    | Show "Trending Now" row or genre browse grid.       |
| Typing         | Loading spinner in search bar. Results update live.  |
| Results        | Grid of cards. Result count shown.                   |
| No results     | Illustration or icon. "No results for [query]". Suggestions: "Try different keywords" or "Browse genres". |
| Loading        | Skeleton card grid (8-12 cards).                    |
| Filter active  | Active filter chip highlighted. Results re-filter.   |
| Error          | "Search unavailable. Try again." with retry.        |

---

## 6. Profile / Settings Page

### Purpose
User profile management. Avatar, display name, watch statistics.

### Desktop Wireframe
```
+------------------------------------------------------------------+
| [Logo]  Home Shows Movies Music Games       [Search] [Avatar]     |
+------------------------------------------------------------------+
|                                                                    |
|  Profile Settings                                                  |
|                                                                    |
|  +------------------+   +------------------------------------+    |
|  |                  |   |                                    |    |
|  |   [  Avatar  ]   |   |  Display Name                     |    |
|  |     96x96        |   |  +------------------------------+ |    |
|  |                  |   |  | Karen                         | |    |
|  |  [Change photo]  |   |  +------------------------------+ |    |
|  |                  |   |                                    |    |
|  +------------------+   |  Email                             |    |
|                         |  karen@example.com  (read-only)    |    |
|                         |                                    |    |
|                         |  [  Save Changes  ]                |    |
|                         +------------------------------------+    |
|                                                                    |
|  --- Watch Stats -----------------------------------------------  |
|                                                                    |
|  +-------------+  +-------------+  +-------------+                 |
|  | 142         |  | 38          |  | 5           |                 |
|  | Hours       |  | Titles      |  | Genres      |                 |
|  | Watched     |  | Completed   |  | Explored    |                 |
|  +-------------+  +-------------+  +-------------+                 |
|                                                                    |
|  Top Genres:  [Sci-Fi] [Action] [Drama]                            |
|                                                                    |
|  --- Account ---------------------------------------------------- |
|                                                                    |
|  [Sign Out]                                                        |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile Wireframe
```
+---------------------+
| [<Back]   Settings  |
+---------------------+
|                     |
|    [  Avatar  ]     |
|      96x96          |
|   [Change photo]    |
|                     |
| Display Name        |
| +------------------+|
| | Karen            ||
| +------------------+|
|                     |
| Email               |
| karen@example.com   |
| (read-only)         |
|                     |
| [  Save Changes  ]  |
|                     |
| --- Watch Stats --- |
| +-----+ +-----+    |
| | 142 | | 38  |    |
| | Hrs | | Done|    |
| +-----+ +-----+    |
|                     |
| Top: SciFi Action   |
|                     |
| [Sign Out]          |
|                     |
+-----  BottomNav  ---+
```

### Component Inventory
- NavBar (with back button on mobile)
- ProfileAvatar (xl size, with upload overlay)
- Input field (display name)
- Read-only field (email)
- Button (primary: Save Changes)
- Button (secondary/ghost: Sign Out, destructive styling)
- Stat cards: `--bb-surface` bg, large number, label below
- Genre pill tags

### Key Interactions
- Click avatar: opens file picker for image upload
- Image preview before save
- Save: PATCH to API, success toast "Profile updated"
- Sign Out: confirmation dialog, then clear auth and redirect to Login

### States

| State          | Description                                        |
|----------------|----------------------------------------------------|
| Default        | Loaded profile data. Stats populated.              |
| Loading        | Skeleton avatar circle + skeleton text lines.      |
| Editing        | Name field focused. Save button enabled.           |
| Uploading      | Avatar shows upload progress overlay.              |
| Save success   | Toast: "Profile updated" (3s auto-dismiss).        |
| Save error     | Toast: "Failed to save. Try again." (error style). |
| New user       | Stats show zeros. "Start watching to see stats!"   |

---

## 7. Friends Page

### Purpose
Manage friends, pending requests, search for users to add.

### Desktop Wireframe
```
+------------------------------------------------------------------+
| [Logo]  Home Shows Movies Music Games       [Search] [Avatar]     |
+------------------------------------------------------------------+
|                                                                    |
|  Friends                                                           |
|                                                                    |
|  Add Friend                                                        |
|  +-----------------------------------------------+  [Send]        |
|  | Enter email address                            |                |
|  +-----------------------------------------------+                |
|                                                                    |
|  Pending Requests (2)                                              |
|  +-----------------------------------------------------------+    |
|  | [Av]  Alex Johnson        Wants to be friends  [OK] [No]  |    |
|  +-----------------------------------------------------------+    |
|  | [Av]  Sam Rivera          Pending (sent)        [Cancel]   |    |
|  +-----------------------------------------------------------+    |
|                                                                    |
|  Your Friends (5)                                                  |
|  +-----------------------------------------------------------+    |
|  | [Av]  Jordan Lee          Watching "Dune"  [Watch] [Msg]   |    |
|  +-----------------------------------------------------------+    |
|  | [Av]  Taylor Kim          Online            [Watch] [Msg]  |    |
|  +-----------------------------------------------------------+    |
|  | [Av]  Casey Nguyen        Offline                          |    |
|  +-----------------------------------------------------------+    |
|  | [Av]  Morgan Chen         Offline                          |    |
|  +-----------------------------------------------------------+    |
|  | [Av]  Riley Park          Offline                          |    |
|  +-----------------------------------------------------------+    |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile Wireframe
```
+---------------------+
| [<Back]   Friends   |
+---------------------+
|                     |
| Add Friend          |
| +------------------+|
| | Email...         ||
| +------------------+|
| [Send]              |
|                     |
| Pending (2)         |
| +------------------+|
| |[Av] Alex     [Y/N||
| +------------------+|
| |[Av] Sam   [Cncl] ||
| +------------------+|
|                     |
| Friends (5)         |
| +------------------+|
| |[Av] Jordan       ||
| |  Watching "Dune" ||
| |  [Watch] [Msg]   ||
| +------------------+|
| |[Av] Taylor       ||
| |  Online          ||
| +------------------+|
| ...                 |
+-----  BottomNav  ---+
```

### Component Inventory
- NavBar
- Input field (email) + Button (Send)
- FriendCard (multiple variants)
- ProfileAvatar (md size, with status indicator)
- Section headers with count badges
- BottomNav (mobile)

### Key Interactions
- Add friend: enter email, send request. Toast "Request sent to [email]"
- Accept: friend moves to Your Friends list
- Decline: request removed with fade-out
- Cancel (sent): pending request removed
- "Watch Together": creates watch session, navigates to lobby
- Friend status updates in real-time via Socket.io

### States

| State          | Description                                        |
|----------------|----------------------------------------------------|
| Default        | Friends list, pending requests.                    |
| Loading        | Skeleton friend rows.                              |
| No friends     | Illustration. "Add friends by email to share the experience." |
| No pending     | Pending section hidden.                            |
| Add success    | Toast "Request sent!" Input clears.                |
| Add error      | "Email not found" or "Already friends" inline error.|
| Self-add       | "You cannot add yourself" inline error.            |

---

## 8. Admin Page

### Purpose
Manage media library metadata. Add/edit titles, trigger re-scans.

### Desktop Wireframe
```
+------------------------------------------------------------------+
| [Logo]  Home Shows Movies Music Games       [Search] [Avatar]     |
+------------------------------------------------------------------+
|                                                                    |
|  Admin: Media Library                           [Scan Library]     |
|                                                                    |
|  +-----------------------------------------------------------+    |
|  | Search media...                                            |    |
|  +-----------------------------------------------------------+    |
|                                                                    |
|  [All] [Movies] [Shows] [Music] [Games]                           |
|                                                                    |
|  +-----------------------------------------------------------+    |
|  | [Thumb]  Dune: Part Two          Movie  2024      [Edit]  |    |
|  +-----------------------------------------------------------+    |
|  | [Thumb]  Breaking Bad            Show   2008      [Edit]  |    |
|  +-----------------------------------------------------------+    |
|  | [Thumb]  Dark Side of the Moon   Music  1973      [Edit]  |    |
|  +-----------------------------------------------------------+    |
|                                                                    |
|  --- Edit Panel (expands inline or modal) --------------------     |
|                                                                    |
|  +-----------------------------------------------------------+    |
|  | Title:       [Dune: Part Two                    ]         |    |
|  | Description: [Paul Atreides unites with the...  ]         |    |
|  |              [multi-line textarea                ]         |    |
|  | Genres:      [sci-fi, action, drama             ]         |    |
|  | Keywords:    [desert, prophecy, sandworm         ]         |    |
|  | Year:        [2024        ]                                |    |
|  | Poster:      [Upload] or [current-poster.jpg]              |    |
|  |                                                            |    |
|  |              [  Save  ]  [Cancel]                          |    |
|  +-----------------------------------------------------------+    |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile Wireframe
```
+---------------------+
| [<Back]    Admin    |
+---------------------+
|                     |
| [Scan Library]      |
|                     |
| +------------------+|
| | Search media...  ||
| +------------------+|
|                     |
| [All][Mov][Shw][Mu]|
|                     |
| +------------------+|
| |[Th] Dune: Pt2   ||
| |  Movie 2024 [Ed]||
| +------------------+|
| |[Th] Breaking Bad ||
| |  Show 2008  [Ed] ||
| +------------------+|
|                     |
| (Edit opens as      |
|  bottom sheet)      |
|                     |
+-----  BottomNav  ---+
```

### Component Inventory
- NavBar
- Button (primary: Scan Library, with loading spinner during scan)
- Search input (filter media list)
- Filter chips (media type)
- Media list rows: thumbnail (60x40), title, type badge, year, edit button
- Edit form: inputs (title, year), textarea (description), tag inputs (genres, keywords), file upload (poster)
- Button (primary: Save), Button (ghost: Cancel)
- Bottom sheet (mobile edit form)

### Key Interactions
- Scan Library: triggers POST /api/media/scan. Button shows spinner. Toast on complete.
- Edit: expands inline form (desktop) or opens bottom sheet (mobile)
- Save: PATCH to API. Success toast. Row updates.
- Filter and search narrow the list in real-time.

### States

| State          | Description                                        |
|----------------|----------------------------------------------------|
| Default        | Full media list with thumbnails.                   |
| Loading        | Skeleton list rows.                                |
| Scanning       | "Scanning..." indicator with progress if available.|
| Scan complete  | Toast "Scan complete. X new titles found."         |
| Editing        | Form expanded/open with current values populated.  |
| Save success   | Toast "Saved." Form closes. Row refreshes.         |
| Save error     | Inline error on form. "Failed to save."            |
| Empty library  | "No media found. Add files to /media and scan."    |
| No results     | "No media matches your search."                    |

---

## 9. Watch Together Lobby

### Purpose
Pre-session screen where the host picks media and waits for a friend to join.

### Desktop Wireframe
```
+------------------------------------------------------------------+
| [Logo]  Home Shows Movies Music Games       [Search] [Avatar]     |
+------------------------------------------------------------------+
|                                                                    |
|  Watch Together                                                    |
|                                                                    |
|  +-----------------------------------------------------------+    |
|  |                                                           |    |
|  |  Now Playing                                               |    |
|  |  +-------------+                                          |    |
|  |  | [Poster]    |  Dune: Part Two                          |    |
|  |  |             |  2024  |  2h 15m  |  Sci-Fi              |    |
|  |  +-------------+  [Change Title]                          |    |
|  |                                                           |    |
|  |  Participants                                              |    |
|  |  +-----------+  +-----------+                             |    |
|  |  | [Avatar]  |  | [Avatar]  |                             |    |
|  |  |  You      |  |  Jordan   |                             |    |
|  |  |  (Host)   |  |  Ready    |                             |    |
|  |  +-----------+  +-----------+                             |    |
|  |                                                           |    |
|  |  Invite Link: blockbuster.local/watch/abc123  [Copy]      |    |
|  |                                                           |    |
|  |          [    Start Watching    ]                          |    |
|  |                                                           |    |
|  +-----------------------------------------------------------+    |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile Wireframe
```
+---------------------+
| [<Back] Watch Party |
+---------------------+
|                     |
| Now Playing         |
| +------------------+|
| | [Poster] Dune:   ||
| |          Part Two||
| |  2024 | 2h 15m   ||
| | [Change Title]   ||
| +------------------+|
|                     |
| Participants        |
| [Av] You (Host)    |
| [Av] Jordan (Ready)|
|                     |
| Invite Link         |
| [Copy Link]         |
|                     |
| [ Start Watching ]  |
|                     |
+-----  BottomNav  ---+
```

### Component Inventory
- NavBar
- Media info block (poster thumbnail, title, metadata)
- ProfileAvatar (lg size) for each participant
- Status labels: "Host", "Ready", "Joining..."
- Copy link button
- Button (primary: Start Watching -- host only)
- Button (ghost: Change Title -- opens media picker)

### Key Interactions
- Host creates session, selects media
- Share link or invite friend directly
- Participant joins via link. Real-time update via Socket.io.
- "Start Watching" begins synced playback for both
- "Change Title" returns to browse/search to pick different media
- If participant leaves before start, their slot shows "Waiting..."

### States

| State             | Description                                       |
|-------------------|---------------------------------------------------|
| Waiting for guest | Host sees their avatar + empty slot "Invite a friend". Start button disabled. |
| Guest joined      | Both avatars visible. Start button enabled.       |
| Guest ready       | "Ready" label on guest. Everything green to go.   |
| Starting          | "Starting in 3... 2... 1..." countdown overlay.  |
| Host left         | Guest sees "Host disconnected. Session ended."    |
| Guest left        | Host sees empty slot again. Can re-invite.        |
| No media selected | "Pick something to watch" placeholder. Start disabled. |
| Loading           | Skeleton poster + avatar placeholders.            |

---

## 10. Mobile Navigation (Bottom Tab Bar)

### Purpose
Primary navigation on mobile devices (below 640px). Persistent at screen bottom.

### Wireframe
```
+-----------------------------------------------+
|  [Home icon]  [Search]  [Friends]  [Profile]   |
|   Home         Search    Friends    Profile     |
+-----------------------------------------------+
```

Height: 56px. Background: `--bb-bg` with top border `--bb-border`.

### Component Spec

Each tab: icon (24px) + label (xs, 12px). Vertical stack, centered.

**States**:

| State         | Behavior                                         |
|---------------|--------------------------------------------------|
| Active        | Icon color: `--bb-accent`. Label: `#ffffff`.     |
| Inactive      | Icon color: `--bb-text-muted`. Label: `--bb-text-muted`. |
| Badge         | Red dot (8px) on Friends icon for pending requests. |
| With MiniPlayer| BottomNav shifts down. MiniPlayer sits directly above. Total: 120px from bottom edge. |
| Hidden        | Hidden during fullscreen player.                 |
| Tap           | Instant navigation (no transition animation).    |
| Long press    | No action (prevent accidental triggers).         |

### Safe Areas

On devices with home indicators (iPhone with Face ID, etc.):
- Add `env(safe-area-inset-bottom)` padding below the tab bar
- Tab bar content stays above the home indicator

---

## Global Patterns

### Toast Notifications

Position: bottom-center (desktop), top-center (mobile, above BottomNav conflicts).
Width: auto, max 400px. Background: `--bb-surface`. Border: `--bb-border`. `radius-lg`.
Auto-dismiss: 3s for success, 5s for errors. Swipe to dismiss on mobile.

Variants:
- Success: left border or icon in `--bb-success`
- Error: left border or icon in `--bb-error`
- Info: left border or icon in `--bb-text-secondary`

### Empty States

Every list/grid has a dedicated empty state:
- Centered vertically in available space
- Icon or illustration (64px, `--bb-text-muted`)
- Heading: medium weight, lg size
- Subtext: normal weight, base size, `--bb-text-secondary`
- Optional CTA button

### Loading Skeletons

All pages use skeleton loading, not spinners, for initial page load:
- Rounded rectangles matching content dimensions
- Shimmer animation: gradient sweep left-to-right, 1.5s, infinite
- Color: `--bb-surface` base with `--bb-elevated` shimmer highlight
- Match the exact layout of loaded content (prevents layout shift)

### Error States

Full-page errors:
- Centered icon (alert-circle, 64px)
- "Something went wrong" heading
- Descriptive subtext
- "Try Again" primary button
- "Go Home" ghost button

Inline errors:
- Red border on affected field
- Error message below in `--bb-error` color, sm size
- Error icon (alert-circle, 16px) inline with message
