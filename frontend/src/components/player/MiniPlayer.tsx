'use client';

import { Play, Pause, X, Music } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MiniPlayerProps {
  mediaId: string;
  title: string;
  isPlaying: boolean;
  progress: number; // 0-100
  onPlayPause: () => void;
  onClose: () => void;
}

export function MiniPlayer({
  mediaId,
  title,
  isPlaying,
  progress,
  onPlayPause,
  onClose,
}: MiniPlayerProps) {
  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-[70] h-16',
        'bottom-14 md:bottom-0',
        'bg-card border-t border-border',
      )}
    >
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="h-full flex items-center px-3 gap-3">
        {/* Album art placeholder */}
        <Link
          href={`/player/${mediaId}`}
          className="flex-shrink-0 w-12 h-12 rounded-md bg-secondary flex items-center justify-center"
          aria-label={`Open player for ${title}`}
        >
          <Music className="w-5 h-5 text-muted-foreground" />
        </Link>

        {/* Title */}
        <Link
          href={`/player/${mediaId}`}
          className="flex-1 min-w-0"
        >
          <p className="text-sm font-medium text-foreground truncate">
            {title}
          </p>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onPlayPause}
            className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-foreground fill-foreground" />
            ) : (
              <Play className="w-5 h-5 text-foreground fill-foreground" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Close mini player"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
