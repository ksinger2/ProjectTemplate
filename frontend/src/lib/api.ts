import { API_BASE } from './constants';

// ---------------------------------------------------------------------------
// Types (defined locally to avoid workspace resolution issues)
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface Media {
  id: string;
  title: string;
  type: 'movie' | 'show' | 'music' | 'game';
  description?: string;
  genres: string[];
  keywords: string[];
  year?: number;
  duration?: number;
  posterPath?: string;
  thumbnailPath?: string;
  filePath: string;
  slug: string;
  codec?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  id: string;
  mediaId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: number;
  filePath: string;
  thumbnailPath?: string;
  introStart?: number;
  introEnd?: number;
}

export interface Subtitle {
  id: string;
  mediaId: string;
  episodeId?: string;
  language: string;
  filePath: string;
  format: 'vtt' | 'srt';
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface WatchHistory {
  id: string;
  userId: string;
  mediaId: string;
  episodeId?: string;
  positionSeconds: number;
  durationSeconds: number;
  status: 'in_progress' | 'completed';
  updatedAt: string;
}

export type Rating = 'up' | 'down' | null;

export interface UserRating {
  id: string;
  userId: string;
  mediaId: string;
  rating: 'up' | 'down';
  createdAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';
  createdAt: string;
}

export interface FriendWithProfile extends Friend {
  friend: User;
}

export interface Recommendation {
  id: string;
  fromUserId: string;
  toUserId: string;
  mediaId: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
}

export interface RecommendationWithDetails extends Recommendation {
  fromUser: User;
  media: Media;
}

export interface WatchSession {
  id: string;
  hostId: string;
  mediaId: string;
  episodeId?: string;
  status: 'waiting' | 'playing' | 'ended';
  createdAt: string;
}

export interface WatchSessionParticipant {
  userId: string;
  user: User;
  role: 'host' | 'guest';
  isReady: boolean;
}

export interface SearchParams {
  type?: string;
  genre?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Base fetch wrapper
// ---------------------------------------------------------------------------

function toQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = path.startsWith('/') ? path : `${API_BASE}/${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, body.error ?? body.message ?? 'Request failed');
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const api = {
  // Auth -------------------------------------------------------------------
  auth: {
    login: (email: string) =>
      apiFetch<User>(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    logout: () =>
      apiFetch<void>(`${API_BASE}/auth/logout`, { method: 'POST' }),
    me: () =>
      apiFetch<User>(`${API_BASE}/users/me`),
  },

  // Media ------------------------------------------------------------------
  media: {
    list: (params?: SearchParams) =>
      apiFetch<PaginatedResponse<Media>>(
        `${API_BASE}/media${params ? `?${toQueryString(params as Record<string, unknown>)}` : ''}`,
      ),
    get: (id: string) =>
      apiFetch<Media>(`${API_BASE}/media/${id}`),
    search: (q: string) =>
      apiFetch<Media[]>(`${API_BASE}/media/search?q=${encodeURIComponent(q)}`),
    streamUrl: (id: string) =>
      apiFetch<{ url: string; expiresAt: number }>(`${API_BASE}/media/${id}/stream-url`, {
        method: 'POST',
      }),
    scan: () =>
      apiFetch<{ added: number; updated: number; removed: number }>(
        `${API_BASE}/media/scan`,
        { method: 'POST' },
      ),
  },

  // Episodes ---------------------------------------------------------------
  episodes: {
    list: (mediaId: string) =>
      apiFetch<Episode[]>(`${API_BASE}/media/${mediaId}/episodes`),
    streamUrl: (episodeId: string) =>
      apiFetch<{ url: string; expiresAt: number }>(`${API_BASE}/episodes/${episodeId}/stream-url`, {
        method: 'POST',
      }),
  },

  // Watch History ----------------------------------------------------------
  watch: {
    history: (status?: 'in_progress' | 'completed') =>
      apiFetch<(WatchHistory & { media: Media })[]>(
        `${API_BASE}/watch-history${status ? `?status=${status}` : ''}`,
      ),
    updatePosition: (data: {
      mediaId: string;
      episodeId?: string;
      positionSeconds: number;
      durationSeconds: number;
    }) =>
      apiFetch<WatchHistory>(`${API_BASE}/watch-history`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Ratings ----------------------------------------------------------------
  ratings: {
    rate: (mediaId: string, rating: Rating) =>
      apiFetch<UserRating>(`${API_BASE}/ratings`, {
        method: 'POST',
        body: JSON.stringify({ mediaId, rating }),
      }),
  },

  // Recommendations --------------------------------------------------------
  recommendations: {
    forYou: () =>
      apiFetch<Media[]>(`${API_BASE}/recommendations`),
    becauseYouWatched: (mediaId: string) =>
      apiFetch<Media[]>(`${API_BASE}/recommendations/because/${mediaId}`),
    inbox: () =>
      apiFetch<RecommendationWithDetails[]>(`${API_BASE}/recommendations/inbox`),
    share: (mediaId: string, toUserId: string, message?: string) =>
      apiFetch<Recommendation>(`${API_BASE}/recommendations/share`, {
        method: 'POST',
        body: JSON.stringify({ mediaId, toUserId, message }),
      }),
  },

  // Friends ----------------------------------------------------------------
  friends: {
    list: () =>
      apiFetch<FriendWithProfile[]>(`${API_BASE}/friends`),
    add: (email: string) =>
      apiFetch<Friend>(`${API_BASE}/friends`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    accept: (friendId: string) =>
      apiFetch<Friend>(`${API_BASE}/friends/${friendId}/accept`, { method: 'POST' }),
    reject: (friendId: string) =>
      apiFetch<void>(`${API_BASE}/friends/${friendId}/reject`, { method: 'POST' }),
    block: (friendId: string) =>
      apiFetch<void>(`${API_BASE}/friends/${friendId}/block`, { method: 'POST' }),
    remove: (friendId: string) =>
      apiFetch<void>(`${API_BASE}/friends/${friendId}`, { method: 'DELETE' }),
  },

  // Users ------------------------------------------------------------------
  users: {
    updateProfile: (data: { displayName?: string }) =>
      apiFetch<User>(`${API_BASE}/users/me`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiFetch<{ avatarUrl: string }>(`${API_BASE}/users/me/avatar`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
    },
  },

  // Watch Together ---------------------------------------------------------
  sessions: {
    create: (mediaId: string, episodeId?: string) =>
      apiFetch<WatchSession>(`${API_BASE}/sessions`, {
        method: 'POST',
        body: JSON.stringify({ mediaId, episodeId }),
      }),
    get: (id: string) =>
      apiFetch<WatchSession & { participants: WatchSessionParticipant[] }>(
        `${API_BASE}/sessions/${id}`,
      ),
    invite: (sessionId: string, friendId: string) =>
      apiFetch<void>(`${API_BASE}/sessions/${sessionId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      }),
    end: (id: string) =>
      apiFetch<void>(`${API_BASE}/sessions/${id}`, { method: 'DELETE' }),
  },

  // Admin ------------------------------------------------------------------
  admin: {
    listMedia: () =>
      apiFetch<Media[]>(`${API_BASE}/admin/media`),
    updateMedia: (id: string, data: Partial<Media>) =>
      apiFetch<Media>(`${API_BASE}/admin/media/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    triggerScan: () =>
      apiFetch<{ added: number; updated: number }>(`${API_BASE}/media/scan`, {
        method: 'POST',
      }),
  },
};
