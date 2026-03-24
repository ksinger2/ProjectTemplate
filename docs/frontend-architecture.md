# Blockbuster Frontend Architecture

> Implementation guide for the Blockbuster frontend. All engineers must follow the patterns, conventions, and component contracts defined here.

---

## Table of Contents

1. [Tech Stack Summary](#1-tech-stack-summary)
2. [Directory Structure](#2-directory-structure)
3. [Design Tokens and Theme](#3-design-tokens-and-theme)
4. [Component Inventory](#4-component-inventory)
5. [Custom Hooks](#5-custom-hooks)
6. [API Client](#6-api-client)
7. [State Management Strategy](#7-state-management-strategy)
8. [Performance Strategy](#8-performance-strategy)
9. [Accessibility Requirements](#9-accessibility-requirements)
10. [Coding Conventions](#10-coding-conventions)

---

## 1. Tech Stack Summary

| Concern | Technology | Version |
|---------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.x |
| Animation | Framer Motion | 12.x |
| Video Player | Plyr + plyr-react + HLS.js | 3.8 / 1.6 |
| Icons | Lucide React | 1.x |
| Real-time | socket.io-client | 4.8 |
| Shared Types | `@blockbuster/shared` workspace package | -- |
| CSS Utilities | clsx + tailwind-merge via `cn()` | -- |

**Not yet installed (to add when implementing):**

| Concern | Technology | Why |
|---------|-----------|-----|
| Server State | TanStack Query (React Query) | Caching, refetching, pagination |
| Client State (Player) | Zustand | Lightweight store for player position, mode |
| Virtual Scrolling | @tanstack/react-virtual | Large media grids (100+ items) |

---

## 2. Directory Structure

```
frontend/src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (dark theme, TooltipProvider, nav shell)
│   ├── page.tsx                  # Home: hero, Continue Watching, category rows
│   ├── login/
│   │   └── page.tsx              # Email login form
│   ├── search/
│   │   └── page.tsx              # Search results grid
│   ├── media/
│   │   └── [id]/
│   │       └── page.tsx          # Media detail: poster, description, episodes, actions
│   ├── player/
│   │   └── [id]/
│   │       └── page.tsx          # Video/music player (dynamic import)
│   ├── profile/
│   │   └── page.tsx              # User profile settings
│   ├── friends/
│   │   └── page.tsx              # Friend list, requests, shared recommendations
│   └── admin/
│       └── page.tsx              # Media metadata editor (admin only)
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (DO NOT EDIT)
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── scroll-area.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── tabs.tsx
│   │   └── tooltip.tsx
│   │
│   ├── layout/                   # App-level layout components
│   │   ├── NavBar.tsx
│   │   ├── MobileNav.tsx
│   │   └── Footer.tsx
│   │
│   ├── media/                    # Media browsing components
│   │   ├── MediaCard.tsx
│   │   ├── MediaRow.tsx
│   │   ├── MediaGrid.tsx
│   │   ├── MediaDetail.tsx
│   │   └── EpisodeList.tsx
│   │
│   ├── player/                   # Playback components
│   │   ├── VideoPlayer.tsx
│   │   ├── MusicPlayer.tsx
│   │   ├── MiniPlayer.tsx
│   │   ├── PlayerControls.tsx
│   │   └── SubtitleSelector.tsx
│   │
│   ├── search/                   # Search components
│   │   ├── SearchBar.tsx
│   │   └── SearchResults.tsx
│   │
│   ├── social/                   # Friends and reactions
│   │   ├── FriendCard.tsx
│   │   ├── FriendList.tsx
│   │   ├── EmojiPicker.tsx
│   │   └── EmojiReaction.tsx
│   │
│   ├── watch/                    # Watch-related components
│   │   ├── ContinueWatchingCard.tsx
│   │   └── WatchTogetherLobby.tsx
│   │
│   └── profile/                  # Profile components
│       ├── ProfileForm.tsx
│       ├── AvatarUpload.tsx
│       └── RatingButtons.tsx
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useMedia.ts
│   ├── useMediaList.ts
│   ├── useSearch.ts
│   ├── useWatchHistory.ts
│   ├── usePlayer.ts
│   ├── useSocket.ts
│   ├── useRecommendations.ts
│   └── useFriends.ts
│
├── lib/                          # Utilities and clients
│   ├── utils.ts                  # cn() helper (exists)
│   ├── api.ts                    # Typed API client
│   ├── socket.ts                 # Socket.io singleton
│   └── constants.ts              # Emoji set, breakpoints, config
│
├── providers/                    # React context providers
│   ├── AuthProvider.tsx
│   ├── SocketProvider.tsx
│   ├── PlayerProvider.tsx
│   └── QueryProvider.tsx
│
└── styles/                       # Additional styles if needed
    └── plyr-overrides.css        # Plyr theme overrides for dark mode
```

### File naming conventions

- Components: `PascalCase.tsx` (e.g., `MediaCard.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useMedia.ts`)
- Utilities: `camelCase.ts` (e.g., `api.ts`)
- Pages: `page.tsx` inside the route directory (Next.js convention)
- No barrel files (`index.ts`) -- import directly from the file

---

## 3. Design Tokens and Theme

The app runs in permanent dark mode. The `dark` class is applied to `<html>` in the root layout. All color references must use design tokens, never hardcoded hex values.

### Custom tokens defined in `globals.css`

| Token | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| Background | `--background` / `bg-background` | `#141414` | Page background |
| Surface | `--color-surface` / `bg-surface` | `#1f1f1f` | Cards, elevated surfaces |
| Accent | `--color-bb-accent` / `bg-bb-accent` | `#e50914` | Primary CTA, branding (Blockbuster red) |
| Foreground | `--foreground` / `text-foreground` | near-white | Primary text |
| Muted Foreground | `--muted-foreground` / `text-muted-foreground` | gray | Secondary text, metadata |
| Border | `--border` / `border-border` | white 10% | Dividers, card outlines |
| Card | `--card` / `bg-card` | dark gray | Card backgrounds |
| Destructive | `--destructive` | red-orange | Error states, delete actions |

### Rules

1. **Never use raw hex values** in component files. Use Tailwind token classes (`bg-background`, `text-foreground`, `bg-bb-accent`, `bg-surface`).
2. **Spacing** uses Tailwind's default scale (4px base). Consistent spacing: `p-4` for card padding, `gap-4` for grids, `gap-6` for section spacing.
3. **Border radius** uses `--radius` (0.625rem base). Apply via `rounded-md`, `rounded-lg`, etc.
4. **Typography**: Geist Sans (`--font-geist-sans`) for body, Geist Mono (`--font-geist-mono`) for code/metadata. Set via the root layout.
5. **Shadows**: Minimal. Use `shadow-lg` sparingly on hover overlays and modals.

---

## 4. Component Inventory

### 4.1 Layout Components

#### NavBar

**File**: `components/layout/NavBar.tsx`

```typescript
interface NavBarProps {
  user: UserProfile | null;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Avatar`, `DropdownMenu`, `Button`, `Tooltip` |
| State | Auth context for user profile |
| Behavior | Sticky `top-0 z-50`. Transparent on scroll-top, solid `bg-background/95 backdrop-blur` on scroll. Logo left, search trigger center-right, profile avatar right. |
| Responsive | Full nav on `md+`. On `< md`, collapses to logo + avatar only (search moves to `MobileNav`). |
| Accessibility | `<nav>` landmark, `aria-label="Main navigation"`, keyboard-navigable dropdown. |

#### MobileNav

**File**: `components/layout/MobileNav.tsx`

```typescript
// No props -- reads route from Next.js usePathname()
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Tooltip` |
| Icons | Lucide: `Home`, `Search`, `Users`, `User` |
| State | Client-only, reads current pathname |
| Behavior | Fixed bottom bar, `md:hidden`. Four tabs: Home, Search, Friends, Profile. Active tab highlighted with `bb-accent`. |
| Responsive | Visible only below `md` breakpoint. |
| Accessibility | `<nav aria-label="Mobile navigation">`, each tab is a link with `aria-current="page"` when active. |

#### Footer

**File**: `components/layout/Footer.tsx`

```typescript
// No props
```

| Aspect | Detail |
|--------|--------|
| Behavior | Minimal footer. "Blockbuster" branding, pushed to bottom via flex layout. Hidden on player page. |
| Responsive | Same on all sizes. |

---

### 4.2 Media Components

#### MediaCard

**File**: `components/media/MediaCard.tsx`

```typescript
interface MediaCardProps {
  media: Media;
  watchProgress?: number;       // 0-100 percentage, omit for no progress bar
  onPlay?: (id: string) => void;
  size?: 'sm' | 'md' | 'lg';   // default: 'md'
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Card`, `Badge`, `Skeleton` (for loading state) |
| State | Local hover state |
| Behavior | Poster image (Next.js `<Image>`) with 2:3 aspect ratio. On hover: dark overlay with title, duration badge, play icon button. If `watchProgress` is provided, renders a thin progress bar at the bottom. `onPlay` fires on click/Enter. |
| Responsive | `sm`: 120px wide (mobile row). `md`: 180px (desktop row). `lg`: 220px (featured). |
| Accessibility | `role="article"`, `aria-label="{title}"`, play button is focusable with `aria-label="Play {title}"`. |

#### MediaRow

**File**: `components/media/MediaRow.tsx`

```typescript
interface MediaRowProps {
  title: string;
  items: Media[];
  watchProgressMap?: Record<string, number>; // mediaId -> percentage
  onPlayMedia?: (id: string) => void;
  isLoading?: boolean;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `ScrollArea`, `Skeleton`, `Button` |
| State | Local scroll position for arrow visibility |
| Behavior | Netflix-style horizontal scroll row. Title on top-left. Left/right arrow buttons appear on hover (desktop only). Renders `MediaCard` for each item. Shows 6 skeleton cards when `isLoading`. Scroll snaps to card boundaries. |
| Responsive | Horizontal scroll on all sizes. Arrow buttons hidden on touch devices (`pointer: coarse`). Card size shrinks on mobile. |
| Accessibility | `role="region"`, `aria-label="{title}"`, arrow buttons labeled `aria-label="Scroll left/right"`. |

#### MediaGrid

**File**: `components/media/MediaGrid.tsx`

```typescript
interface MediaGridProps {
  items: Media[];
  onPlayMedia?: (id: string) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Skeleton`, `Button` |
| State | Intersection observer for infinite scroll |
| Behavior | Responsive grid of `MediaCard` components. Used on search results page. Infinite scroll via intersection observer triggers `onLoadMore`. Renders skeleton grid when loading. |
| Responsive | `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`. |
| Virtual scrolling | For libraries with 100+ items, wrap with `@tanstack/react-virtual` to virtualize rows. |
| Accessibility | `role="feed"`, `aria-busy` during load. |

#### MediaDetail

**File**: `components/media/MediaDetail.tsx`

```typescript
interface MediaDetailProps {
  media: MediaDetail;
  userRating?: Rating;
  onPlay: (episodeId?: string) => void;
  onRate: (rating: Rating) => void;
  onShare?: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Button`, `Badge`, `Separator`, `Dialog` (for share) |
| State | Local state for expanded description |
| Behavior | Hero section with poster (left) and metadata (right). Title, year, duration, genres as badges, description (truncated with "More" toggle). Play button (prominent, `bb-accent` background). Rate and Share buttons. If media is a show, renders `EpisodeList` below. |
| Responsive | Side-by-side on `md+`, stacked on mobile with poster as full-width hero banner. |
| Accessibility | Heading hierarchy: `h1` for title. Buttons have descriptive labels. |

#### EpisodeList

**File**: `components/media/EpisodeList.tsx`

```typescript
interface EpisodeListProps {
  episodes: Episode[];
  subtitles?: Subtitle[];
  currentEpisodeId?: string;
  watchProgressMap?: Record<string, number>; // episodeId -> percentage
  onPlayEpisode: (episodeId: string) => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Separator` |
| State | Active season tab (local) |
| Behavior | Groups episodes by season. Tab bar for season selection. Each episode row shows: episode number, title, duration, progress bar if partially watched. Click plays that episode. Current episode highlighted. |
| Responsive | Full-width on all sizes. Episode rows stack vertically. |
| Accessibility | Tab panel pattern with `aria-controls`. Episode rows are focusable list items. |

---

### 4.3 Player Components

#### VideoPlayer

**File**: `components/player/VideoPlayer.tsx`

```typescript
type PlayerMode = 'fullscreen' | 'half' | 'pip';

interface VideoPlayerProps {
  mediaId: string;
  episodeId?: string;
  streamUrl: string;
  subtitles: Subtitle[];
  initialPosition?: number;    // seconds to resume from
  mode: PlayerMode;
  onModeChange: (mode: PlayerMode) => void;
  onPositionUpdate: (positionSeconds: number) => void;
  onEnded: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| Dependencies | `plyr-react`, `hls.js`, Framer Motion (transitions) |
| State | Player context (Zustand store) for position, playing, buffering. Local ref to Plyr instance. |
| Behavior | Wraps Plyr with HLS.js for adaptive streaming. Loads stream via blob URL (no raw file path exposed in DOM). Sends position updates every 10 seconds via `onPositionUpdate`. Supports three modes: fullscreen (covers viewport), half (50% height, content below), PiP (browser Picture-in-Picture API with CSS fallback). Disables right-click context menu. Intercepts Ctrl+S. |
| Dynamic import | This component MUST be loaded via `next/dynamic` with `ssr: false` since Plyr and HLS.js require the browser DOM. |
| Responsive | Fullscreen and PiP are the same on all sizes. Half mode not available on mobile (auto-switches to fullscreen). |
| Accessibility | Plyr provides built-in keyboard controls. Add `aria-label` to custom controls. Announce mode changes to screen readers. |

#### MusicPlayer

**File**: `components/player/MusicPlayer.tsx`

```typescript
interface MusicPlayerProps {
  media: Media;
  streamUrl: string;
  onPositionUpdate: (positionSeconds: number) => void;
  onEnded: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Button`, `Skeleton` |
| State | Player context (Zustand) |
| Behavior | Audio-only player. Large album art display (or placeholder), track title, artist. Standard audio controls: play/pause, seek bar, volume, time display. No video element. |
| Responsive | Centered layout on desktop, full-width on mobile. |

#### MiniPlayer

**File**: `components/player/MiniPlayer.tsx`

```typescript
interface MiniPlayerProps {
  media: Media;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  onPlayPause: () => void;
  onClose: () => void;
  onExpand: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Button`, `Avatar` (for album art thumbnail) |
| State | Reads from player context |
| Behavior | Persistent bottom bar (above `MobileNav` if present). Shows: small album art, track title, play/pause, close. Thin progress bar at top edge. Click body to expand to full `MusicPlayer`. Visible only during music playback. |
| Responsive | Full-width bar. On mobile, positioned above `MobileNav` with `bottom-16`. |
| Accessibility | `role="complementary"`, `aria-label="Now playing: {title}"`. Controls labeled. |

#### PlayerControls

**File**: `components/player/PlayerControls.tsx`

```typescript
interface PlayerControlsProps {
  mode: PlayerMode;
  onModeChange: (mode: PlayerMode) => void;
  subtitles: Subtitle[];
  activeSubtitle: string | null;
  onSubtitleChange: (subtitleId: string | null) => void;
  isWatchTogether?: boolean;
  onEmojiPickerToggle?: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Button`, `DropdownMenu`, `Tooltip` |
| Behavior | Overlay controls on the video player. Mode toggle buttons (fullscreen, half, PiP). Subtitle selector. During watch-together sessions, shows emoji picker trigger button. |

#### SubtitleSelector

**File**: `components/player/SubtitleSelector.tsx`

```typescript
interface SubtitleSelectorProps {
  subtitles: Subtitle[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `DropdownMenu` |
| Behavior | Dropdown listing available subtitle tracks by language label. "Off" option to disable. |

---

### 4.4 Search Components

#### SearchBar

**File**: `components/search/SearchBar.tsx`

```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Input`, `Button` |
| State | Local state for input value. Debounced (300ms) before calling `onSearch`. |
| Behavior | On desktop NavBar: starts as a search icon button. Click expands to input field with animation (width transition). On mobile: full-width input on the search page. Pressing Escape or clicking away collapses it. |
| Responsive | Icon-to-input expand on `md+`. Always-visible input on search page. |
| Accessibility | `role="search"`, `<input>` has `aria-label="Search media"`. Escape key closes. |

#### SearchResults

**File**: `components/search/SearchResults.tsx`

```typescript
interface SearchResultsProps {
  query: string;
  results: Media[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| Behavior | Displays search query as heading, results in `MediaGrid`, empty state message when no results. |

---

### 4.5 Social Components

#### FriendCard

**File**: `components/social/FriendCard.tsx`

```typescript
interface FriendCardProps {
  friend: FriendWithProfile;
  onAccept?: (friendId: string) => void;
  onReject?: (friendId: string) => void;
  onBlock?: (friendId: string) => void;
  onRemove?: (friendId: string) => void;
  onWatchTogether?: (friendId: string) => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Avatar`, `Button`, `Card`, `Badge`, `DropdownMenu` |
| Behavior | Avatar, display name, status badge (pending/accepted). Action buttons vary by status: pending shows accept/reject, accepted shows watch-together/remove. Overflow menu for block. |

#### FriendList

**File**: `components/social/FriendList.tsx`

```typescript
interface FriendListProps {
  friends: FriendWithProfile[];
  pendingRequests: FriendWithProfile[];
  onAction: (action: string, friendId: string) => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Tabs`, `Separator`, `Input` (for add-by-email) |
| Behavior | Tabbed view: "Friends" and "Requests" (with count badge). Add friend by email form at top. List of `FriendCard` components. |

#### EmojiPicker

**File**: `components/social/EmojiPicker.tsx`

```typescript
interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| State | Local |
| Behavior | Grid of 20 preset emojis (defined in `lib/constants.ts`). Appears on long-press (500ms) of the emoji button during watch-together. Click selects and closes. Click outside closes. Rate limited: visually disabled for 1 second after selection. |
| Responsive | Positioned above the trigger button. Fixed size 5x4 grid. |
| Accessibility | `role="listbox"`, each emoji is `role="option"` with `aria-label` describing the emoji. |

**Emoji set** (defined in `lib/constants.ts`):
```typescript
export const EMOJI_SET = [
  '👍', '👎', '😂', '😮', '😢', '😡', '🥰', '🔥', '💀', '👀',
  '🎉', '😱', '🤔', '💯', '❤️', '😴', '🤯', '👏', '🫣', '😈',
] as const;
```

#### EmojiReaction

**File**: `components/social/EmojiReaction.tsx`

```typescript
interface EmojiReactionProps {
  emoji: string;
  id: string; // unique key for animation
}
```

| Aspect | Detail |
|--------|--------|
| Dependencies | Framer Motion |
| Behavior | Animated emoji burst. Emoji appears at a random horizontal position near the bottom of the player, floats upward, scales up slightly, and fades out over 2 seconds. Auto-removes from DOM after animation completes. |
| Accessibility | `aria-hidden="true"` -- decorative only. |

---

### 4.6 Watch Components

#### ContinueWatchingCard

**File**: `components/watch/ContinueWatchingCard.tsx`

```typescript
interface ContinueWatchingCardProps {
  media: Media;
  watchHistory: WatchHistory;
  onResume: (mediaId: string, episodeId?: string) => void;
}
```

| Aspect | Detail |
|--------|--------|
| Behavior | Extends `MediaCard` with a progress bar overlay and "Resume" action. Progress bar uses `bb-accent` color. Shows "X min left" text. |
| Note | Only shown for movies and shows, never for music or games (filtered at the data layer). |

#### WatchTogetherLobby

**File**: `components/watch/WatchTogetherLobby.tsx`

```typescript
interface WatchTogetherLobbyProps {
  session: WatchSession;
  participants: WatchSessionParticipant[];
  friends: FriendWithProfile[];
  onInvite: (friendId: string) => void;
  onStart: () => void;
  onLeave: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Dialog`, `Avatar`, `Button`, `Separator` |
| Behavior | Modal/dialog showing session info: media title, host indicator, participant avatars (max 2). Friend invite dropdown if fewer than 2 participants. "Start Watching" button for host. "Leave" button for all. |

---

### 4.7 Profile Components

#### ProfileForm

**File**: `components/profile/ProfileForm.tsx`

```typescript
interface ProfileFormProps {
  user: User;
  onSave: (data: { displayName: string }) => void;
  isSaving: boolean;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Input`, `Button`, `Card`, `Separator` |
| Behavior | Editable display name. Email shown as read-only. Save button with loading state. |

#### AvatarUpload

**File**: `components/profile/AvatarUpload.tsx`

```typescript
interface AvatarUploadProps {
  currentUrl: string | null;
  onUpload: (file: File) => void;
  isUploading: boolean;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Avatar`, `Button` |
| Behavior | Displays current avatar (or initials fallback). Click to open file picker (images only, max 2MB). Shows upload progress. Preview before confirming. |

#### RatingButtons

**File**: `components/profile/RatingButtons.tsx`

```typescript
interface RatingButtonsProps {
  mediaId: string;
  currentRating: Rating;   // -1, 0, or 1
  onRate: (rating: Rating) => void;
}
```

| Aspect | Detail |
|--------|--------|
| shadcn dependencies | `Button`, `Tooltip` |
| Icons | Lucide: `ThumbsUp`, `ThumbsDown` |
| Behavior | Two buttons: thumbs up and thumbs down. Active state: filled icon with `bb-accent` color. Clicking the currently active rating toggles it off (sets to 0). |
| Accessibility | `aria-pressed` attribute reflects state. Tooltips show "Like"/"Dislike". |

---

## 5. Custom Hooks

All hooks that fetch data use TanStack Query. They return `{ data, isLoading, error }` unless noted otherwise.

### useAuth

**File**: `hooks/useAuth.ts`

```typescript
interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

| Aspect | Detail |
|--------|--------|
| Source | AuthProvider context |
| Behavior | On mount, calls `GET /api/users/me` to validate the session cookie. Exposes `login` (calls `POST /api/auth/login` with email, sets cookie) and `logout` (calls `POST /api/auth/logout`, clears cookie, redirects to `/login`). |
| Cookie | JWT is stored as an httpOnly cookie by the backend. The frontend never reads the token directly. |

### useMedia

**File**: `hooks/useMedia.ts`

```typescript
function useMedia(id: string): {
  data: MediaDetail | undefined;
  isLoading: boolean;
  error: Error | null;
}
```

| Aspect | Detail |
|--------|--------|
| Query key | `['media', id]` |
| Endpoint | `GET /api/media/:id` |
| Returns | `MediaDetail` (includes episodes and subtitles for shows) |
| Stale time | 5 minutes |

### useMediaList

**File**: `hooks/useMediaList.ts`

```typescript
function useMediaList(params: SearchParams): {
  data: PaginatedResponse<Media> | undefined;
  isLoading: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}
```

| Aspect | Detail |
|--------|--------|
| Query key | `['media', 'list', params]` |
| Endpoint | `GET /api/media` with query params |
| Pagination | Uses TanStack Query's `useInfiniteQuery`. Page size: 24. |
| Stale time | 2 minutes |

### useSearch

**File**: `hooks/useSearch.ts`

```typescript
function useSearch(query: string): {
  data: Media[] | undefined;
  isLoading: boolean;
  error: Error | null;
}
```

| Aspect | Detail |
|--------|--------|
| Query key | `['search', query]` |
| Endpoint | `GET /api/media/search?q={query}` |
| Behavior | Query is disabled when `query` is empty or less than 2 characters. Debounce happens in the component (SearchBar), not in the hook. |
| Stale time | 1 minute |

### useWatchHistory

**File**: `hooks/useWatchHistory.ts`

```typescript
function useWatchHistory(): {
  continueWatching: (WatchHistory & { media: Media })[];
  isLoading: boolean;
  error: Error | null;
  updatePosition: (mediaId: string, episodeId: string | null, positionSeconds: number, durationSeconds: number) => void;
}
```

| Aspect | Detail |
|--------|--------|
| Query key | `['watch-history']` |
| Endpoint | `GET /api/watch-history?status=in_progress` |
| Mutation | `updatePosition` calls `POST /api/watch-history` and optimistically updates the cache. |
| Refetch | On window focus. |

### usePlayer

**File**: `hooks/usePlayer.ts`

```typescript
interface PlayerState {
  mediaId: string | null;
  episodeId: string | null;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  mode: PlayerMode;
  isMiniPlayerVisible: boolean;
}

interface UsePlayerReturn extends PlayerState {
  play: (mediaId: string, episodeId?: string) => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setMode: (mode: PlayerMode) => void;
  showMiniPlayer: () => void;
  hideMiniPlayer: () => void;
}
```

| Aspect | Detail |
|--------|--------|
| Source | Zustand store (not React Query -- this is client-only state) |
| Behavior | Manages the active player session. Persists nothing to server (watch history hook handles that). The mini player reads from this store to know what is playing. |

### useSocket

**File**: `hooks/useSocket.ts`

```typescript
interface UseSocketReturn {
  isConnected: boolean;
  joinSession: (sessionId: string) => void;
  leaveSession: () => void;
  sendPlay: () => void;
  sendPause: () => void;
  sendSeek: (position: number) => void;
  sendEmoji: (emoji: string) => void;
  onSync: (callback: (data: SyncPayload) => void) => void;
  onEmoji: (callback: (data: EmojiPayload) => void) => void;
}
```

| Aspect | Detail |
|--------|--------|
| Source | SocketProvider context |
| Behavior | Wraps the socket.io-client instance. Authenticates via the JWT cookie on connection. Auto-reconnects on disconnect. Heartbeat every 2 seconds during active watch-together sessions with current position. |

### useRecommendations

**File**: `hooks/useRecommendations.ts`

```typescript
function useRecommendations(): {
  forYou: Media[];
  becauseYouWatched: { source: Media; recommendations: Media[] }[];
  fromFriends: RecommendationWithDetails[];
  isLoading: boolean;
}
```

| Aspect | Detail |
|--------|--------|
| Query keys | `['recommendations']`, `['recommendations', 'inbox']` |
| Endpoints | `GET /api/recommendations`, `GET /api/recommendations/inbox` |
| Stale time | 10 minutes (recommendations are expensive to compute) |

### useFriends

**File**: `hooks/useFriends.ts`

```typescript
function useFriends(): {
  friends: FriendWithProfile[];
  pendingRequests: FriendWithProfile[];
  isLoading: boolean;
  addFriend: (email: string) => Promise<void>;
  acceptRequest: (friendId: string) => Promise<void>;
  rejectRequest: (friendId: string) => Promise<void>;
  blockFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}
```

| Aspect | Detail |
|--------|--------|
| Query key | `['friends']` |
| Endpoint | `GET /api/friends` |
| Mutations | All friend actions are mutations that invalidate the `['friends']` query on success. |

---

## 6. API Client

**File**: `lib/api.ts`

### Base Fetch Wrapper

```typescript
async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',    // Always send cookies
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error);
  }

  return response.json();
}
```

Notes:
- All requests go through the Next.js rewrite (`/api/*` -> `localhost:4000/api/*`), so no CORS issues in development.
- Auth cookies are httpOnly and managed entirely by the backend. The frontend never reads or sets them.
- The `ApiResponse<T>` envelope is always expected. Errors throw an `ApiError` with status code and message.

### Endpoint Methods

```typescript
export const api = {
  // Auth
  auth: {
    login: (email: string) =>
      apiFetch<User>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),
    logout: () =>
      apiFetch<void>('/api/auth/logout', { method: 'POST' }),
    me: () =>
      apiFetch<User>('/api/users/me'),
  },

  // Media
  media: {
    list: (params?: SearchParams) =>
      apiFetch<PaginatedResponse<Media>>(`/api/media?${toQueryString(params)}`),
    get: (id: string) =>
      apiFetch<MediaDetail>(`/api/media/${id}`),
    search: (q: string) =>
      apiFetch<Media[]>(`/api/media/search?q=${encodeURIComponent(q)}`),
    streamUrl: (id: string) =>
      apiFetch<{ url: string }>(`/api/media/${id}/stream`),
  },

  // Watch History
  watch: {
    history: (status?: WatchStatus) =>
      apiFetch<(WatchHistory & { media: Media })[]>(`/api/watch-history?status=${status ?? ''}`),
    updatePosition: (data: {
      mediaId: string;
      episodeId?: string;
      positionSeconds: number;
      durationSeconds: number;
    }) =>
      apiFetch<WatchHistory>('/api/watch-history', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Ratings
  ratings: {
    rate: (mediaId: string, rating: Rating) =>
      apiFetch<UserRating>('/api/ratings', { method: 'POST', body: JSON.stringify({ mediaId, rating }) }),
  },

  // Recommendations
  recommendations: {
    forYou: () =>
      apiFetch<Media[]>('/api/recommendations'),
    becauseYouWatched: (mediaId: string) =>
      apiFetch<Media[]>(`/api/recommendations/because/${mediaId}`),
    inbox: () =>
      apiFetch<RecommendationWithDetails[]>('/api/recommendations/inbox'),
    share: (mediaId: string, toUserId: string, message?: string) =>
      apiFetch<Recommendation>('/api/recommendations/share', {
        method: 'POST',
        body: JSON.stringify({ mediaId, toUserId, message }),
      }),
  },

  // Friends
  friends: {
    list: () =>
      apiFetch<FriendWithProfile[]>('/api/friends'),
    add: (email: string) =>
      apiFetch<Friend>('/api/friends', { method: 'POST', body: JSON.stringify({ email }) }),
    accept: (friendId: string) =>
      apiFetch<Friend>(`/api/friends/${friendId}/accept`, { method: 'POST' }),
    reject: (friendId: string) =>
      apiFetch<void>(`/api/friends/${friendId}/reject`, { method: 'POST' }),
    block: (friendId: string) =>
      apiFetch<void>(`/api/friends/${friendId}/block`, { method: 'POST' }),
    remove: (friendId: string) =>
      apiFetch<void>(`/api/friends/${friendId}`, { method: 'DELETE' }),
  },

  // Users
  users: {
    updateProfile: (data: { displayName?: string }) =>
      apiFetch<User>('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiFetch<{ avatarUrl: string }>('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for multipart
      });
    },
  },

  // Watch Together
  sessions: {
    create: (mediaId: string, episodeId?: string) =>
      apiFetch<WatchSession>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ mediaId, episodeId }),
      }),
    get: (id: string) =>
      apiFetch<WatchSession & { participants: WatchSessionParticipant[] }>(`/api/sessions/${id}`),
    invite: (sessionId: string, friendId: string) =>
      apiFetch<void>(`/api/sessions/${sessionId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      }),
    end: (id: string) =>
      apiFetch<void>(`/api/sessions/${id}`, { method: 'DELETE' }),
  },

  // Admin
  admin: {
    listMedia: () =>
      apiFetch<Media[]>('/api/admin/media'),
    updateMedia: (id: string, data: Partial<Media>) =>
      apiFetch<Media>(`/api/admin/media/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    triggerScan: () =>
      apiFetch<{ added: number; updated: number }>('/api/media/scan', { method: 'POST' }),
  },
};
```

### Error Handling

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

All hooks should handle errors via TanStack Query's built-in error state. Components render error UI based on `error` from the hook. 401 errors trigger a redirect to `/login` via the `AuthProvider`.

---

## 7. State Management Strategy

### Server State -- TanStack Query

All data that originates from the backend is managed by TanStack Query (React Query).

| Data | Query Key | Stale Time | Refetch Strategy |
|------|-----------|-----------|------------------|
| Media list | `['media', 'list', params]` | 2 min | On window focus |
| Media detail | `['media', id]` | 5 min | On mount |
| Search results | `['search', query]` | 1 min | On query change |
| Watch history | `['watch-history']` | 30 sec | On window focus, after mutation |
| Recommendations | `['recommendations']` | 10 min | On mount |
| Friend inbox | `['recommendations', 'inbox']` | 2 min | On window focus |
| Friends list | `['friends']` | 2 min | On window focus, after mutation |
| User profile | `['user', 'me']` | 10 min | On mount |

**QueryProvider** wraps the app in `providers/QueryProvider.tsx` and is mounted in the root layout.

### Client State -- Zustand (Player)

The player store is the only piece of significant client-side state. It tracks:

- Currently playing media/episode IDs
- Playback state (playing, paused, buffering)
- Current position and duration
- Active mode (fullscreen, half, PiP)
- Mini player visibility

This store is NOT persisted. It resets on page reload, which is correct since playback state is ephemeral.

### Client State -- React Context (Auth, Socket)

| Provider | Purpose | Mounted In |
|----------|---------|-----------|
| `AuthProvider` | Current user, login/logout methods, auth loading state | Root layout |
| `SocketProvider` | Socket.io connection instance, connection status | Root layout (lazy -- connects only when user is authenticated) |
| `QueryProvider` | TanStack Query client | Root layout |
| `PlayerProvider` | Zustand store for player state | Root layout |

Provider nesting order in root layout:

```tsx
<QueryProvider>
  <AuthProvider>
    <SocketProvider>
      <PlayerProvider>
        <TooltipProvider>
          {children}
          <MiniPlayer />
          <MobileNav />
        </TooltipProvider>
      </PlayerProvider>
    </SocketProvider>
  </AuthProvider>
</QueryProvider>
```

### Real-time State -- Socket.io

Socket.io handles two categories of real-time events:

**Watch Together Sync:**
- `sync:play`, `sync:pause`, `sync:seek` -- player control sync
- `sync:position` -- heartbeat every 2s from guests
- `sync:buffering` -- pause all when one user buffers
- `session:ended` -- host ended session

**Emoji Reactions:**
- `emoji:send` -- client emits emoji to session room
- `emoji:receive` -- client receives emoji, renders `EmojiReaction`

Connection lifecycle:
1. `SocketProvider` creates connection when user is authenticated
2. Connection uses JWT from cookie for auth (socket.io `auth` option)
3. Auto-reconnect with exponential backoff
4. Disconnect on logout or tab close

---

## 8. Performance Strategy

### Image Optimization

- All poster images use Next.js `<Image>` component with `fill` + `sizes` for responsive loading.
- Poster sizes: `sizes="(max-width: 640px) 120px, (max-width: 1024px) 180px, 220px"`.
- Thumbnails served from `/data/thumbnails/` via backend with cache headers.
- Lazy loading is default (`loading="lazy"`) for all images below the fold.
- Placeholder: use `blur` placeholder with a low-res base64 string generated during media scan (or use `Skeleton` component as fallback).

### Code Splitting

- **Player page**: Dynamic import for `VideoPlayer` and `MusicPlayer` via `next/dynamic` with `ssr: false`. Plyr + HLS.js add roughly 150KB gzipped; they must not be in the main bundle.
- **Admin page**: Dynamic import for the admin form components (rarely accessed).
- **EmojiPicker**: Dynamic import, loaded only during watch-together sessions.

```typescript
const VideoPlayer = dynamic(() => import('@/components/player/VideoPlayer'), {
  ssr: false,
  loading: () => <PlayerSkeleton />,
});
```

### Virtual Scrolling

For `MediaGrid` rendering more than 100 items (e.g., full library search with no filters), use `@tanstack/react-virtual` to virtualize rows. Each row renders a fixed number of cards based on the current grid column count.

### Prefetching

- On `MediaCard` hover (or `onMouseEnter`), prefetch the media detail query:
  ```typescript
  queryClient.prefetchQuery({ queryKey: ['media', id], queryFn: () => api.media.get(id) });
  ```
- Next.js link prefetching is enabled by default for in-viewport links.

### Skeleton Loading

Every data-dependent component has a loading state using the shadcn `Skeleton` primitive:

- `MediaCard`: gray rectangle in 2:3 ratio + text skeleton below
- `MediaRow`: 6 skeleton cards in a horizontal row
- `MediaGrid`: 12 skeleton cards in a grid
- `MediaDetail`: poster skeleton + text block skeletons
- `EpisodeList`: 4 row skeletons

Pattern: the hook returns `isLoading`, the component checks it and renders skeletons.

```tsx
if (isLoading) return <MediaRowSkeleton />;
```

### Bundle Budget

| Metric | Target |
|--------|--------|
| First Load JS | < 120 KB gzipped |
| Player page JS (lazy) | < 180 KB gzipped |
| LCP (home page) | < 2.5s |
| TTI | < 3.5s |

---

## 9. Accessibility Requirements

These are non-negotiable for every component.

### Semantic HTML

- Use `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>` landmarks appropriately.
- Headings follow strict hierarchy (`h1` > `h2` > `h3`). One `h1` per page.
- Lists of items use `<ul>` / `<ol>`.
- Interactive elements use `<button>` (not `<div onClick>`).
- Links use `<a>` (via Next.js `Link`).

### Keyboard Navigation

- All interactive elements are focusable and operable via keyboard.
- `MediaRow` arrow buttons are keyboard-accessible. Cards within rows are tabbable.
- Player controls respond to keyboard shortcuts (Plyr handles this natively): Space (play/pause), Arrow keys (seek), M (mute), F (fullscreen).
- Modal dialogs trap focus (shadcn `Dialog` handles this).
- Escape key closes overlays, modals, and expanded search.

### Screen Readers

- All images have meaningful `alt` text (media title for posters).
- Icon-only buttons have `aria-label`.
- Loading states announce via `aria-busy` and `aria-live="polite"` regions.
- Player mode changes are announced.
- Emoji reactions are `aria-hidden` (decorative).

### Color and Contrast

- Text on `bg-background` (#141414) must meet WCAG AA (4.5:1 ratio minimum).
- `text-foreground` (near-white) on `bg-background` passes.
- `text-muted-foreground` (gray) on `bg-background` must be checked -- use no lighter than `oklch(0.65 0 0)`.
- `bb-accent` (#e50914) is used only for large text, buttons, and progress bars -- not for small body text.

### Focus Indicators

- All focusable elements show a visible focus ring: `outline-ring/50` (defined in globals.css base layer).
- Never remove outlines without providing an alternative indicator.

---

## 10. Coding Conventions

### Component Structure

Every component file follows this order:

```typescript
// 1. Imports (React, Next.js, shared types, shadcn, local)
// 2. Props interface
// 3. Component (named export, not default)
// 4. Sub-components if small and tightly coupled (otherwise separate file)
```

Example:

```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Media } from '@blockbuster/shared';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  media: Media;
  watchProgress?: number;
  onPlay?: (id: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function MediaCard({ media, watchProgress, onPlay, size = 'md' }: MediaCardProps) {
  // implementation
}
```

### Import Order

1. React / Next.js built-ins
2. External libraries (framer-motion, plyr, etc.)
3. Shared types (`@blockbuster/shared`)
4. shadcn/ui components (`@/components/ui/*`)
5. Local components (`@/components/*`)
6. Hooks (`@/hooks/*`)
7. Utilities (`@/lib/*`)

### Client vs Server Components

- **Server Components** (default): pages that fetch data, layout components without interactivity.
- **Client Components** (`'use client'`): anything with `useState`, `useEffect`, event handlers, browser APIs, context consumers.
- Rule: push `'use client'` as far down the tree as possible. A page can be a server component that renders client component children.

### Error Handling Pattern

Every page that fetches data should handle three states:

```tsx
export default function MediaPage({ params }: { params: { id: string } }) {
  const { data, isLoading, error } = useMedia(params.id);

  if (isLoading) return <MediaDetailSkeleton />;
  if (error) return <ErrorDisplay message={error.message} />;
  if (!data) return <NotFound />;

  return <MediaDetail media={data} />;
}
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `MediaCard.tsx` |
| Hook files | camelCase with `use` prefix | `useMedia.ts` |
| Utility files | camelCase | `api.ts` |
| CSS class composition | Use `cn()` helper | `cn('base-class', conditional && 'active')` |
| Props interfaces | `{ComponentName}Props` | `MediaCardProps` |
| Event handlers in props | `on{Event}` | `onPlay`, `onRate` |
| Boolean props | `is{State}` or `has{Thing}` | `isLoading`, `hasMore` |

### Testing (future)

Tests will live alongside components:

```
components/media/MediaCard.tsx
components/media/MediaCard.test.tsx
```

Use Vitest + React Testing Library. Every component must be testable in isolation via props.

---

## Appendix: shadcn/ui Components Installed

These primitives are available in `components/ui/` and must be used instead of building custom equivalents:

| Component | Primary Usage |
|-----------|--------------|
| `Avatar` | User profile images, friend avatars |
| `Badge` | Genre tags, status indicators, notification counts |
| `Button` | All clickable actions (primary, secondary, ghost, destructive variants) |
| `Card` | Media cards, friend cards, profile sections |
| `Dialog` | Modals (share, watch-together lobby, confirmations) |
| `DropdownMenu` | Profile menu, subtitle selector, overflow actions |
| `Input` | Search bar, profile form, friend email input |
| `ScrollArea` | Horizontal media rows, episode lists |
| `Separator` | Section dividers |
| `Sheet` | Mobile slide-out panels |
| `Skeleton` | Loading placeholders for all data-dependent UI |
| `Tabs` | Season selector, friend list tabs |
| `Tooltip` | Icon button labels, abbreviation expansions |

**Rule**: If a shadcn primitive covers the use case, use it. Do not build a custom dropdown, modal, or tab component. If a new shadcn component is needed (e.g., `Slider` for volume), install it via `npx shadcn@latest add slider`.
