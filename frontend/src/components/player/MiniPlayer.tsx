'use client';

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Music,
  Volume2,
  VolumeX,
  Loader2,
} from 'lucide-react';
import { useMusicPlayer } from '@/providers/MusicPlayerProvider';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    isMuted,
    pause,
    resume,
    next,
    previous,
    seek,
    toggleMute,
    close,
  } = useMusicPlayer();

  // Don't render when no track is loaded
  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const thumbnailUrl = currentTrack.posterUrl
    ? `/api/media/${currentTrack.albumId || currentTrack.id}/thumbnail`
    : null;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    seek(pct * duration);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-[70] h-16',
        'bottom-14 md:bottom-0',
        'bg-bb-nav border-t border-border',
        'animate-in slide-in-from-bottom duration-300',
      )}
    >
      {/* Clickable progress bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-secondary cursor-pointer group"
        onClick={handleProgressClick}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') seek(Math.min(currentTime + 5, duration));
          if (e.key === 'ArrowLeft') seek(Math.max(currentTime - 5, 0));
        }}
      >
        <div
          className="h-full bg-bb-accent transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
        {/* Hover indicator */}
        <div className="absolute top-0 left-0 right-0 h-2 -translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="h-full flex items-center px-3 gap-3">
        {/* Album art */}
        <div className="flex-shrink-0 w-12 h-12 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={currentTrack.albumTitle || currentTrack.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // On error, hide the img and show placeholder
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Music className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {currentTrack.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {currentTrack.artist}
          </p>
        </div>

        {/* Time display — hidden on very small screens */}
        <span className="hidden sm:block text-xs text-muted-foreground flex-shrink-0 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Volume toggle — hidden on mobile */}
          <button
            type="button"
            onClick={toggleMute}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-md hover:bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Previous */}
          <button
            type="button"
            onClick={previous}
            className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4 text-foreground fill-foreground" />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={isLoading}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-foreground animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 text-foreground fill-foreground" />
            ) : (
              <Play className="w-5 h-5 text-foreground fill-foreground" />
            )}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={next}
            className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4 text-foreground fill-foreground" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={close}
            className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Close mini player"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
