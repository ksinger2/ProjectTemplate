'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Media {
  id: string;
  title: string;
  type: 'movie' | 'show' | 'music' | 'game';
  posterUrl: string | null;
  description: string | null;
  year: number | null;
  genres: string[];
  keywords: string[];
  durationSeconds: number | null;
  filePath: string;
  codec: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WatchHistoryEntry {
  id: string;
  userId: string;
  mediaId: string;
  episodeId: string | null;
  positionSeconds: number;
  durationSeconds: number;
  percentageWatched: number;
  status: 'in_progress' | 'finished';
  lastWatchedAt: string;
  media?: Media;
}

interface ContinueWatchingCardProps {
  media: Media;
  watchHistory: WatchHistoryEntry;
}

function formatMinutesLeft(positionSeconds: number, durationSeconds: number): string {
  const remaining = Math.max(0, durationSeconds - positionSeconds);
  const minutes = Math.ceil(remaining / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
  }
  return `${minutes}m left`;
}

export function ContinueWatchingCard({ media, watchHistory }: ContinueWatchingCardProps) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = `/api/media/${media.id}/thumbnail`;
  const showPoster = media.posterUrl !== null && !imgError;

  const progress = Math.min(100, Math.max(0, watchHistory.percentageWatched));
  const timeLeft = formatMinutesLeft(watchHistory.positionSeconds, watchHistory.durationSeconds);

  const resumeUrl = `/player/${media.id}?t=${Math.floor(watchHistory.positionSeconds)}`;

  return (
    <Link
      href={resumeUrl}
      className={cn(
        'group relative flex-shrink-0 rounded-lg overflow-hidden',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
        'transition-transform duration-200 ease-out',
        'hover:scale-105 hover:z-10',
        'w-[180px]',
      )}
    >
      {/* Poster / Placeholder */}
      <div className="aspect-[2/3] w-full relative bg-card">
        {showPoster ? (
          <img
            src={thumbnailUrl}
            alt={media.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-bb-blue to-surface flex items-center justify-center">
            <Film className="w-10 h-10 text-muted-foreground/50" />
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent',
            'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
            'transition-opacity duration-200',
            'flex flex-col justify-end p-3',
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-bb-accent flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 text-black fill-black ml-0.5" />
            </div>
            <span className="text-white text-sm font-semibold truncate">
              {media.title}
            </span>
          </div>
          <span className="text-white/70 text-xs ml-10">{timeLeft}</span>
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-secondary">
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
