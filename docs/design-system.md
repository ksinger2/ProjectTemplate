# Blockbuster Design System

Version 1.0 -- Last updated 2026-03-23

---

## 1. Color Palette

### Backgrounds

| Token             | Value     | Usage                              |
|-------------------|-----------|------------------------------------|
| `--bb-bg`         | `#141414` | Page background, app shell         |
| `--bb-surface`    | `#1f1f1f` | Cards, modals, drawers, popovers   |
| `--bb-elevated`   | `#2a2a2a` | Elevated cards, dropdowns, tooltips|
| `--bb-overlay`    | `rgba(0,0,0,0.7)` | Scrim behind modals, player overlay |

### Accent / Brand

| Token                | Value     | Usage                       |
|----------------------|-----------|-----------------------------|
| `--bb-accent`        | `#e50914` | Primary CTA, active states  |
| `--bb-accent-hover`  | `#b20710` | Hover on primary CTA        |
| `--bb-accent-pressed`| `#8c0510` | Active/pressed on primary CTA |

### Text

| Token             | Value     | Usage                                  |
|-------------------|-----------|-----------------------------------------|
| `--bb-text`       | `#ffffff` | Primary text, titles, headings          |
| `--bb-text-secondary` | `#b3b3b3` | Descriptions, metadata, timestamps  |
| `--bb-text-muted` | `#808080` | Disabled text, placeholders, captions   |
| `--bb-text-inverse`| `#141414`| Text on light/accent backgrounds        |

### Semantic

| Token             | Value     | Usage                        |
|-------------------|-----------|------------------------------|
| `--bb-success`    | `#46d369` | Match %, positive indicators |
| `--bb-warning`    | `#e5a00d` | Warnings, pending states     |
| `--bb-error`      | `#e50914` | Errors, destructive actions  |

### Borders

| Token             | Value                | Usage                     |
|-------------------|----------------------|---------------------------|
| `--bb-border`     | `rgba(255,255,255,0.1)` | Default borders, dividers |
| `--bb-border-focus`| `#ffffff`           | Focus ring color          |

### Gradients

| Name              | Value                                              | Usage                     |
|-------------------|----------------------------------------------------|---------------------------|
| Hero fade-bottom  | `linear-gradient(transparent, #141414)`             | Hero banner bottom fade   |
| Hero fade-left    | `linear-gradient(90deg, #141414 0%, transparent 50%)` | Hero banner left fade (desktop) |
| Card hover overlay| `linear-gradient(transparent 40%, rgba(0,0,0,0.85) 100%)` | MediaCard hover info overlay |
| Skeleton shimmer  | `linear-gradient(90deg, #1f1f1f 0%, #2a2a2a 50%, #1f1f1f 100%)` | Loading skeleton animation |

---

## 2. Typography

### Font Stack

```css
--bb-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
--bb-font-mono: ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace;
```

### Type Scale

| Token    | Size  | Line Height | Usage                                  |
|----------|-------|-------------|----------------------------------------|
| `xs`     | 12px  | 16px        | Badges, timestamps, fine print         |
| `sm`     | 14px  | 20px        | Metadata, captions, secondary labels   |
| `base`   | 16px  | 24px        | Body text, descriptions, buttons       |
| `lg`     | 18px  | 28px        | Row titles, section headers            |
| `xl`     | 24px  | 32px        | Media titles, page headings            |
| `2xl`    | 32px  | 40px        | Hero subtitle, feature headings        |
| `3xl`    | 40px  | 48px        | Hero title (tablet)                    |
| `4xl`    | 48px  | 56px        | Hero title (desktop)                   |

### Font Weights

| Weight     | Value | Usage                                     |
|------------|-------|-------------------------------------------|
| `normal`   | 400   | Body text, descriptions                   |
| `medium`   | 500   | Metadata, nav links, labels               |
| `semibold` | 600   | Buttons, badges, emphasis                 |
| `bold`     | 700   | Titles, headings, hero text               |

### Usage Rules

- Titles and headings: bold (700)
- Row titles (e.g., "Continue Watching"): semibold (600), lg (18px)
- Body descriptions: normal (400), base (16px)
- Buttons: semibold (600), base (16px)
- Metadata (year, duration, genre tags): medium (500), sm (14px)
- Timestamps and badges: medium (500), xs (12px)
- Maximum line length: 65ch for body text
- Truncation: single-line titles use `text-overflow: ellipsis`; descriptions clamp to 2-3 lines with `-webkit-line-clamp`

---

## 3. Spacing and Grid

### Base Unit

4px base. All spacing values are multiples of 4.

| Token  | Value | Common Usage                          |
|--------|-------|---------------------------------------|
| `1`    | 4px   | Icon-to-label gap                     |
| `2`    | 8px   | Card gap in scroll rows, tight padding|
| `3`    | 12px  | Input padding, small component gap    |
| `4`    | 16px  | Card padding, mobile page padding     |
| `5`    | 20px  | Section inner padding                 |
| `6`    | 24px  | Between related groups                |
| `8`    | 32px  | Row gap between content rows          |
| `10`   | 40px  | Section separation                    |
| `12`   | 48px  | Desktop page padding, major sections  |
| `16`   | 64px  | Page top/bottom padding               |

### Page Layout

| Property         | Mobile     | Tablet     | Desktop    | Large      |
|------------------|------------|------------|------------|------------|
| Page padding (x) | 16px       | 32px       | 48px       | 48px       |
| Content max-width| 100%       | 100%       | 100%       | 1400px     |
| Row gap (y)      | 24px       | 28px       | 32px       | 32px       |
| Card gap (x)     | 8px        | 8px        | 8px        | 8px        |
| NavBar height    | 56px       | 64px       | 64px       | 64px       |
| Bottom nav height| 56px       | --         | --         | --         |

### Border Radius

| Token        | Value | Usage                             |
|--------------|-------|-----------------------------------|
| `radius-none`| 0     | Full-bleed images                 |
| `radius-sm`  | 4px   | Badges, chips, small tags         |
| `radius-md`  | 6px   | Buttons, inputs                   |
| `radius-lg`  | 8px   | Cards, thumbnails                 |
| `radius-xl`  | 12px  | Modals, sheets                    |
| `radius-full`| 9999px| Avatars, round buttons, pills     |

### Elevation / Shadow

| Level    | Shadow                                        | Usage              |
|----------|-----------------------------------------------|--------------------|
| `0`      | none                                          | Flat cards inline   |
| `1`      | `0 1px 3px rgba(0,0,0,0.4)`                  | Resting cards       |
| `2`      | `0 4px 12px rgba(0,0,0,0.5)`                 | Hovered cards, dropdowns |
| `3`      | `0 8px 24px rgba(0,0,0,0.6)`                 | Modals, sheets      |
| `4`      | `0 16px 48px rgba(0,0,0,0.7)`                | PiP player window   |

---

## 4. Components

### 4.1 MediaCard

The primary browsing unit. Displays a poster thumbnail. Reveals metadata on hover.

**Dimensions**: Aspect ratio 2:3 (portrait poster). Width adapts to grid.

**States**:

| State    | Behavior                                                                 |
|----------|--------------------------------------------------------------------------|
| Default  | Poster image fills card. No text visible. `radius-lg` corners.           |
| Hover    | Scale to 1.05. Gradient overlay fades in from bottom. Title, duration, and play icon appear over the overlay. Elevation rises to level 2. Transition: 200ms ease. |
| Focus    | 2px solid white focus ring with 2px offset. Same content reveal as hover.|
| Loading  | Skeleton rectangle at 2:3 ratio with shimmer animation.                 |
| Error    | Gray placeholder with broken-image icon centered. `--bb-text-muted` color.|
| Long title| Title truncates to 2 lines with ellipsis.                               |

**Anatomy**:
```
+-------------------+
|                   |
|   [Poster Image]  |
|                   |
|                   |
|  -- on hover --   |
|  [gradient]       |
|  Play  Title      |
|        Duration   |
+-------------------+
```

### 4.2 ContinueWatchingCard

Extends MediaCard. Adds a progress bar at the bottom of the poster.

**Additional elements**:
- Progress bar: 3px height, `--bb-accent` fill, `--bb-elevated` track, positioned at card bottom edge
- Percentage or "Xm left" label on hover

**States**: Same as MediaCard, plus:

| State         | Behavior                                |
|---------------|-----------------------------------------|
| 0% progress   | Do not display in Continue Watching row |
| 95%+ progress | Display "Almost done" label             |

### 4.3 MediaRow

A horizontal scrollable row of MediaCards with a section title.

**Anatomy**:
```
Row Title                              See All >
[<] [Card] [Card] [Card] [Card] [Card] [Card] [>]
```

**States**:

| State         | Behavior                                                   |
|---------------|------------------------------------------------------------|
| Default       | Row title (semibold, lg). Cards overflow hidden. Scroll arrows hidden. |
| Hover (row)   | Left/right arrow buttons fade in at row edges (200ms). Arrows are 40x40px circles, `--bb-elevated` bg, white chevron icon. |
| Arrow hover   | Arrow bg brightens to `rgba(255,255,255,0.15)`.            |
| Scrolled left | Left arrow appears. When scrolled to start, left arrow hides. |
| Scrolled right| Right arrow appears. When scrolled to end, right arrow hides.|
| Empty         | Row is hidden entirely. Never show an empty row.           |
| Loading       | Row title as skeleton (120px wide). 6 skeleton MediaCards. |
| Few items     | If fewer cards than viewport width, no arrows. Cards left-aligned. |

**Scroll behavior**: Scroll by the visible width minus one card on arrow click. CSS `scroll-snap-type: x mandatory` on cards. Smooth scroll behavior.

### 4.4 NavBar

Sticky top navigation bar. 64px height (56px mobile).

**Anatomy (desktop)**:
```
[Logo]   Home  Shows  Movies  Music  Games   [Search]  [Avatar]
```

**Anatomy (mobile)**:
```
[Logo]                                        [Search]  [Avatar]
```
Mobile primary navigation moves to BottomNav.

**States**:

| State         | Behavior                                                |
|---------------|---------------------------------------------------------|
| Default       | Transparent background. Visible over hero content.      |
| Scrolled      | Background transitions to `--bb-bg` with 80% opacity + backdrop-blur(20px). Transition: 200ms. |
| Active link   | White text, bold weight. Inactive: `--bb-text-secondary`.|
| Search active | SearchBar expands, nav links collapse on smaller screens.|

### 4.5 SearchBar

Expandable search input in the NavBar.

**Anatomy**:
```
Collapsed: [magnifying glass icon]
Expanded:  [icon] [__search input___] [X]
```

**States**:

| State        | Behavior                                                   |
|--------------|------------------------------------------------------------|
| Collapsed    | 44x44px icon button. Click/focus expands.                  |
| Expanded     | Input field: 280px (desktop), full-width (mobile). `--bb-surface` background, `--bb-border` border, `--bb-text` input text. Auto-focus. |
| Typing       | Debounce 300ms. Dropdown appears below with results.       |
| Results      | Max 8 results. Each row: thumbnail (48x32px), title, type badge, year. Click navigates to detail. |
| No results   | "No results for [query]" message in dropdown.              |
| Loading      | Spinner icon replaces magnifying glass during fetch.       |
| Blur/Escape  | Collapses back to icon. Clears query.                      |

### 4.6 PlayerControls

Overlay controls on the video player. Auto-hide after 3s of inactivity. Show on mouse move or tap.

**Anatomy**:
```
Top bar:    [Back arrow]  Title - S01E01 "Episode Name"     [Cast] [PiP] [Fullscreen]
Center:     [<< 10s]  [ Play/Pause ]  [>> 10s]
Bottom:     [progress bar / seek bar]
            [current time]  [subtitle] [settings] [emoji] [volume slider]  [duration]
```

**States**:

| State         | Behavior                                              |
|---------------|-------------------------------------------------------|
| Default       | Controls visible for 3s, then fade out (300ms).       |
| Hover/Tap     | Controls fade in (150ms). Reset 3s hide timer.        |
| Playing       | Play button shows pause icon.                         |
| Paused        | Pause button shows play icon. Controls stay visible.  |
| Buffering     | Spinner replaces play/pause button center.            |
| Seek bar      | Track: `--bb-elevated`. Loaded: `--bb-text-muted`. Played: `--bb-accent`. Thumb: 14px white circle, appears on hover. Hover shows time tooltip. |
| Volume        | Vertical slider on hover over volume icon. Muted: icon changes to muted variant. |
| Subtitle menu | Dropdown above subtitle icon. Lists available languages. Active has checkmark. |
| Settings menu | Dropdown: playback speed (0.5x to 2x), quality selector.|
| PiP active    | PiP icon highlighted with `--bb-accent`.              |
| Half-screen   | Video occupies top 50vh. Page content scrolls below.  |
| Fullscreen    | Standard fullscreen. Controls overlay.                |
| Idle (3s)     | Controls fade out. Cursor hides.                      |

**Touch (mobile)**:
- Tap: toggle controls visibility
- Double-tap left/right third: skip backward/forward 10s
- Swipe horizontal on seek bar: scrub
- Swipe up on left side: brightness (if supported)
- Swipe up on right side: volume

### 4.7 ProfileAvatar

Circular user avatar image.

**Sizes**:
| Size   | Dimension | Usage                        |
|--------|-----------|------------------------------|
| `sm`   | 32px      | NavBar, inline mentions      |
| `md`   | 40px      | Friend list, comments        |
| `lg`   | 64px      | Profile page, watch session  |
| `xl`   | 96px      | Profile settings, edit view  |

**States**:

| State       | Behavior                                                |
|-------------|---------------------------------------------------------|
| Default     | Circular image crop. Border: 2px solid `--bb-elevated`. |
| No image    | Initials on `--bb-elevated` background. Bold, white text.|
| Watching    | 8px green dot (`--bb-success`) bottom-right, with 2px `--bb-bg` ring. |
| Online      | 8px green dot without watching indicator.               |
| Offline     | No status dot.                                          |

### 4.8 EmojiPicker

Triggered by press-and-hold on the emoji button during playback.

**Anatomy**:
```
+----------------------------------+
|  [emoji] [emoji] [emoji] [emoji] |
|  [emoji] [emoji] [emoji] [emoji] |
|  [emoji] [emoji] [emoji] [emoji] |
|  [emoji] [emoji] [emoji] [emoji] |
|  [emoji] [emoji] [emoji] [emoji] |
+----------------------------------+
```

20 emojis in a 4x5 grid. Each cell: 48x48px.

**States**:

| State         | Behavior                                          |
|---------------|---------------------------------------------------|
| Hidden        | Not visible. Triggered by press-and-hold (500ms). |
| Visible       | Slides up from emoji button. `--bb-surface` bg, `radius-xl`, `shadow-3`. |
| Emoji hover   | Scale 1.2, 100ms ease.                            |
| Emoji selected| Emoji burst animation triggers. Picker closes. Rate limit: 1 per second. If rate-limited, subtle shake animation on picker. |
| Release outside| Picker closes without selection.                  |

**Emoji burst animation**: Selected emoji flies upward from player center, scaling from 1 to 2, opacity fading from 1 to 0, over 2000ms with ease-out. Random slight horizontal drift (-20px to +20px). Visible to all session participants via Socket.io.

### 4.9 EpisodeList

Displayed on Media Detail page for TV shows.

**Anatomy**:
```
Season 1  |  Season 2  |  Season 3          (tab bar)
---------------------------------------------
[Thumb]  1. Episode Title              45m
         Episode description text clamp
         to two lines max...

[Thumb]  2. Episode Title              42m
         Episode description text...
---------------------------------------------
```

**States**:

| State          | Behavior                                              |
|----------------|-------------------------------------------------------|
| Default        | Season tabs at top. Active tab: white text, underline `--bb-accent`. Inactive: `--bb-text-secondary`. |
| Episode row    | 80px thumbnail (16:9), title (semibold), description (2-line clamp, `--bb-text-secondary`), duration right-aligned. |
| Episode hover  | Row bg changes to `--bb-elevated`. Play icon appears on thumbnail. |
| Currently watching | Progress bar below thumbnail. "Watching" badge.   |
| Watched        | Checkmark icon on thumbnail. Title color: `--bb-text-secondary`. |
| Loading        | Skeleton rows: thumbnail rectangle + text lines.      |
| No episodes    | "No episodes found" centered, `--bb-text-muted`.      |

### 4.10 RatingButtons

Thumbs up / thumbs down toggle pair.

**Anatomy**: `[ thumbs-up ] [ thumbs-down ]`

Each button: 40x40px circle, `--bb-elevated` background.

**States**:

| State          | Behavior                                         |
|----------------|--------------------------------------------------|
| Default        | Both icons in `--bb-text-secondary`.             |
| Hover          | Icon and bg brighten. `rgba(255,255,255,0.15)` bg.|
| Liked          | Thumbs-up filled white. Thumbs-down stays muted.|
| Disliked       | Thumbs-down filled white. Thumbs-up stays muted.|
| Toggle         | Clicking the active one de-selects it. Clicking the other swaps. |

### 4.11 FriendCard

Used on the Friends page to display a friend or pending request.

**Anatomy**:
```
[Avatar]  Display Name          [Action Button(s)]
          @email or status
```

**States**:

| State         | Behavior                                          |
|---------------|---------------------------------------------------|
| Friend        | Avatar (md) + name + "Online"/"Offline"/"Watching [Title]". Actions: "Watch Together", "Remove". |
| Pending sent  | Avatar + name + "Pending". Action: "Cancel".      |
| Pending received | Avatar + name + "Wants to be friends". Actions: "Accept", "Decline". |
| Blocked       | Avatar + name + "Blocked". Action: "Unblock".     |
| Hover         | Row bg changes to `--bb-elevated`.                |

### 4.12 MiniPlayer

Persistent bottom bar for music playback. 64px height. Always above BottomNav if present.

**Anatomy**:
```
+-------------------------------------------------------+
| [Album Art 48x48] Title - Artist    [Prev][Play][Next] |
| [===========progress bar===============]               |
+-------------------------------------------------------+
```

**States**:

| State         | Behavior                                          |
|---------------|---------------------------------------------------|
| Hidden        | Not visible when no music is playing.             |
| Playing       | Bar visible. Album art, title (truncate), artist (truncate). Play shows pause icon. Progress bar: `--bb-accent` fill. |
| Paused        | Same layout. Pause shows play icon.               |
| Tap/Click bar | Expands to full music player view.                |
| Loading       | Spinner in place of play/pause.                   |
| Mobile        | Sits above bottom nav. Total reserved space: 64px (mini) + 56px (nav) = 120px. |

---

## 5. Responsive Breakpoints

| Name     | Range          | Cards/Row | Navigation    | Layout Notes                       |
|----------|----------------|-----------|---------------|------------------------------------|
| Mobile   | 0 -- 639px     | 2-3       | Bottom tab bar| Single-column detail. Stacked.     |
| Tablet   | 640 -- 1023px  | 3-4       | Top nav       | Side drawer for secondary nav.     |
| Desktop  | 1024 -- 1399px | 5-6       | Top nav       | Full layout. Scroll rows.          |
| Large    | 1400px+        | 6-7       | Top nav       | Max-width 1400px container centered.|

### Card Width Calculations

Cards in scroll rows fill available width based on breakpoint:
- Card width = (container width - (n-1) * 8px gap) / n
- The scroll row overflows; visible count determines arrow behavior

### Mobile-Specific Adaptations

- Bottom navigation bar: 4 tabs (Home, Search, Friends, Profile). 56px height. Icons + labels. Active tab: `--bb-accent` icon, white label.
- Hero banner: shorter (50vh vs 70vh desktop). Title font: `2xl` instead of `4xl`.
- MediaCards: may show title below poster instead of hover overlay (no hover on touch).
- Player controls: larger touch targets (48px minimum). Gesture-based seeking.
- MiniPlayer sits above BottomNav.

---

## 6. Animation and Motion

### Durations

| Token     | Value  | Usage                                   |
|-----------|--------|-----------------------------------------|
| `fast`    | 100ms  | Micro-interactions: icon swaps, opacity |
| `normal`  | 200ms  | Card hover, button press, fade in/out   |
| `medium`  | 300ms  | PiP transition, panel slides            |
| `slow`    | 500ms  | Page transitions, modal open/close      |
| `emoji`   | 2000ms | Emoji burst fly-up                      |

### Easing

| Name       | Value                        | Usage                     |
|------------|------------------------------|---------------------------|
| `ease-out` | `cubic-bezier(0.16,1,0.3,1)` | Elements entering (appear)|
| `ease-in`  | `cubic-bezier(0.7,0,0.84,0)` | Elements leaving (disappear)|
| `ease`     | `cubic-bezier(0.4,0,0.2,1)`  | General transitions       |
| `spring`   | `cubic-bezier(0.34,1.56,0.64,1)` | Playful bounces (emoji hover) |

### Named Animations

| Animation          | Properties                                              |
|--------------------|---------------------------------------------------------|
| Card hover         | `transform: scale(1.05)`, overlay opacity 0 to 1, 200ms ease |
| Page fade          | Opacity 0 to 1, 150ms ease-out                         |
| Skeleton shimmer   | Background-position sweep, 1.5s infinite linear         |
| Emoji burst        | translateY(-200px), scale(1 to 2), opacity(1 to 0), 2s ease-out, random X drift |
| Scroll arrow fade  | Opacity 0 to 1, 200ms ease                             |
| PiP enter          | Scale down to 0.3, translate to bottom-right corner, 300ms ease |
| PiP exit           | Reverse of enter                                        |
| Controls fade      | Opacity 1 to 0 over 300ms ease-in on hide              |
| Modal open         | Opacity 0 to 1 + scale(0.95 to 1), 300ms ease-out      |
| Progress bar       | Width transition, 200ms linear                          |
| Bottom sheet (mobile)| TranslateY(100%) to translateY(0), 300ms ease-out     |
| Notification badge | Scale(0 to 1) + bounce, 300ms spring                   |

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- All transitions set to 0ms (instant state changes)
- Skeleton shimmer replaced with static gray
- Emoji burst: simple fade-out in place (no movement)
- Card hover: no scale, only overlay opacity change
- Page transitions: instant cuts

---

## 7. Accessibility

### Focus Management

- All interactive elements receive a visible focus ring: `2px solid #ffffff`, offset `2px`, on `--bb-bg` background (provides contrast).
- Focus ring uses `outline` (not `border`) to avoid layout shift.
- Focus order follows visual reading order: left-to-right, top-to-bottom.
- Modal/dialog trap focus within until dismissed.
- On page navigation, focus moves to the page heading.

### Color Contrast

All combinations meet WCAG AA minimum:

| Foreground         | Background     | Ratio  | Passes         |
|--------------------|----------------|--------|----------------|
| `#ffffff` on       | `#141414`      | 15.3:1 | AAA             |
| `#b3b3b3` on       | `#141414`      | 8.5:1  | AAA             |
| `#808080` on       | `#141414`      | 4.7:1  | AA              |
| `#ffffff` on       | `#e50914`      | 4.6:1  | AA (large text) |
| `#ffffff` on       | `#1f1f1f`      | 13.5:1 | AAA             |
| `#ffffff` on       | `#2a2a2a`      | 11.3:1 | AAA             |

### Touch Targets

- Minimum touch target: 44x44px on all interactive elements.
- Player controls on mobile: 48x48px minimum.
- If visual size is smaller (e.g., 32px icon), the tappable area extends with invisible padding to meet the minimum.

### Screen Reader Support

- All images: meaningful `alt` text (media title for posters, empty `alt=""` for decorative).
- Icon buttons: `aria-label` describing the action (e.g., "Play", "Add to favorites", "Open search").
- Live regions: `aria-live="polite"` for search results count, toast notifications.
- Media rows: `role="region"` with `aria-label` matching section title.
- Player: `aria-label` on all controls. Seek bar: `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- Emoji burst: `aria-live="polite"` announcement "[User] reacted with [emoji]".

### Keyboard Navigation

| Key            | Action                                      |
|----------------|---------------------------------------------|
| Tab / Shift+Tab| Move focus forward/backward                 |
| Enter / Space  | Activate focused button or link             |
| Arrow Left/Right| Navigate within rows, sliders, tabs        |
| Escape         | Close modal, collapse search, exit fullscreen|
| Space          | Toggle play/pause in player                 |
| F              | Toggle fullscreen                           |
| M              | Toggle mute                                 |
| Arrow Up/Down  | Volume up/down in player                    |
| Arrow Left/Right| Seek back/forward 10s in player            |
| ?              | Show keyboard shortcut overlay              |

---

## 8. Iconography

Use Lucide icons (included with shadcn/ui). 24px default size. Stroke width: 2px.

Key icons:

| Icon         | Usage                    |
|--------------|--------------------------|
| `play`       | Play button, card overlay|
| `pause`      | Pause state              |
| `skip-back`  | Rewind 10s               |
| `skip-forward`| Forward 10s             |
| `volume-2`   | Volume on                |
| `volume-x`   | Muted                    |
| `maximize`   | Fullscreen               |
| `minimize`   | Exit fullscreen          |
| `picture-in-picture-2` | PiP mode      |
| `subtitles`  | Subtitle toggle          |
| `search`     | Search                   |
| `chevron-left` / `chevron-right` | Scroll arrows |
| `thumb-up` / `thumb-down` | Rating       |
| `users`      | Friends                  |
| `settings`   | Settings                 |
| `home`       | Home nav                 |
| `user`       | Profile                  |
| `x`          | Close, clear             |
| `loader-2`   | Loading spinner (animate-spin) |
| `check`      | Watched, confirmed       |
| `plus`       | Add friend               |

---

## 9. Z-Index Scale

| Token       | Value | Usage                        |
|-------------|-------|------------------------------|
| `base`      | 0     | Page content                 |
| `card-hover`| 10    | Hovered/scaled cards         |
| `sticky`    | 20    | NavBar, BottomNav            |
| `dropdown`  | 30    | Search results, menus        |
| `modal`     | 40    | Modals, dialogs              |
| `overlay`   | 50    | Scrim behind modals          |
| `pip`       | 60    | PiP player window            |
| `mini-player`| 70   | MiniPlayer bar               |
| `toast`     | 80    | Toast notifications          |
| `tooltip`   | 90    | Tooltips                     |
