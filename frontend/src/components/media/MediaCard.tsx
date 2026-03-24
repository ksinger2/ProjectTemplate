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

interface MediaCardProps {
  media: Media;
  onPlay?: (id: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function MediaCard({ media, onPlay, size = 'md' }: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
  const duration = formatDuration(media.durationSeconds);

  const sizeClasses = {
    sm: 'w-[120px]',
    md: 'w-[180px]',
    lg: 'w-[220px]',
  };

  const thumbnailUrl = `/api/media/${media.id}/thumbnail`;
  const showPoster = media.posterUrl !== null && !imgError;

  return (
    <Link
      href={`/media/${media.id}`}
      className={cn(
        'group relative flex-shrink-0 rounded-lg overflow-hidden',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
        'transition-transform duration-200 ease-out',
        'hover:scale-105 hover:z-10',
        sizeClasses[size],
      )}
      onClick={(e) => {
        if (onPlay) {
          e.preventDefault();
          onPlay(media.id);
        }
      }}
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
          {duration && (
            <span className="text-white/70 text-xs ml-10">{duration}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
