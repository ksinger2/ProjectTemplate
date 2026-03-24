export type WatchStatus = 'in_progress' | 'finished';

export interface WatchHistory {
  id: string;
  userId: string;
  mediaId: string;
  episodeId: string | null;
  positionSeconds: number;
  durationSeconds: number;
  percentageWatched: number;
  status: WatchStatus;
  lastWatchedAt: string;
}

export type Rating = -1 | 0 | 1;

export interface UserRating {
  id: string;
  userId: string;
  mediaId: string;
  rating: Rating;
  createdAt: string;
}

export interface WatchSession {
  id: string;
  hostId: string;
  mediaId: string;
  episodeId: string | null;
  status: 'active' | 'ended';
  createdAt: string;
}

export interface WatchSessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: string;
}
