'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Loader2,
  PictureInPicture2,
  SplitSquareVertical,
  Keyboard,
} from 'lucide-react';
import { SubtitleSelector, type SubtitleTrack } from './SubtitleSelector';
import { cn } from '@/lib/utils';
import type { ViewMode } from './VideoPlayer';

export interface CommentMarker {
  id: string;
  timestampSeconds: number;
  text: string;
  displayName: string;
}

interface PlayerControlsProps {
  title: string;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isPip: boolean;
  viewMode: ViewMode;
  subtitles: SubtitleTrack[];
  activeSubtitleId: string | null;
  visible: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onPipToggle: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSubtitleChange: (id: string | null) => void;
  onBack: () => void;
  onShowHelp: () => void;
  /** Extra controls (e.g., emoji picker) injected into the bottom control bar */
  extraControls?: React.ReactNode;
  /** Comment markers on the seek bar */
  commentMarkers?: CommentMarker[];
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerControls({
  title,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  buffered,
  volume,
  isMuted,
  isFullscreen,
  isPip,
  viewMode,
  subtitles,
  activeSubtitleId,
  visible,
  onPlayPause,
  onSeek,
  onSkipBack,
  onSkipForward,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onPipToggle,
  onViewModeChange,
  onSubtitleChange,
  onBack,
  onShowHelp,
  extraControls,
  commentMarkers = [],
}: PlayerControlsProps) {
  const [showVolume, setShowVolume] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [hoveredMarker, setHoveredMarker] = useState<CommentMarker | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const progress = duration > 0 ? ((isSeeking ? seekTime : currentTime) / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration <= 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(fraction * duration);
    },
    [duration, onSeek],
  );

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration <= 0) return;
      setIsSeeking(true);
      const rect = progressRef.current.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setSeekTime(fraction * duration);

      const handleMouseMove = (ev: MouseEvent) => {
        const r = progressRef.current!.getBoundingClientRect();
        const f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
        setSeekTime(f * duration);
      };

      const handleMouseUp = (ev: MouseEvent) => {
        const r = progressRef.current!.getBoundingClientRect();
        const f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
        onSeek(f * duration);
        setIsSeeking(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [duration, onSeek],
  );

  const handleProgressHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration <= 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverTime(fraction * duration);
      setHoverX(e.clientX - rect.left);
    },
    [duration],
  );

  // Touch seek on progress bar
  const handleProgressTouch = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration <= 0) return;
      const touch = e.touches[0];
      const rect = progressRef.current.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      onSeek(fraction * duration);
    },
    [duration, onSeek],
  );

  useEffect(() => {
    return () => {
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    };
  }, []);

  const controlBtnClass =
    'flex items-center justify-center w-11 h-11 rounded-md hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex flex-col justify-between transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      {/* Top gradient + bar */}
      <div className="bg-gradient-to-b from-black/70 to-transparent px-4 pt-3 pb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={controlBtnClass}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="text-foreground text-sm md:text-base font-medium truncate">
            {title}
          </h2>
        </div>
      </div>

      {/* Center controls */}
      <div className="flex-1 flex items-center justify-center gap-6">
        {isBuffering ? (
          <Loader2 className="w-14 h-14 text-foreground animate-spin" />
        ) : (
          <>
            <button
              type="button"
              onClick={onSkipBack}
              className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Rewind 10 seconds"
            >
              <SkipBack className="w-7 h-7 text-foreground" />
            </button>
            <button
              type="button"
              onClick={onPlayPause}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-foreground fill-foreground" />
              ) : (
                <Play className="w-8 h-8 text-foreground fill-foreground ml-1" />
              )}
            </button>
            <button
              type="button"
              onClick={onSkipForward}
              className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Forward 10 seconds"
            >
              <SkipForward className="w-7 h-7 text-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Bottom gradient + controls */}
      <div className="bg-gradient-to-t from-black/70 to-transparent pt-8 px-4 pb-4">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="group relative w-full h-5 flex items-center cursor-pointer mb-2"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
          onTouchMove={handleProgressTouch}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.floor(isSeeking ? seekTime : currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 10));
            if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 10));
          }}
        >
          {/* Track background */}
          <div className="absolute left-0 right-0 h-1 group-hover:h-1.5 transition-all bg-secondary rounded-full overflow-hidden">
            {/* Buffered */}
            <div
              className="absolute inset-y-0 left-0 bg-muted-foreground/40 rounded-full"
              style={{ width: `${bufferedProgress}%` }}
            />
            {/* Played */}
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Comment markers */}
          {duration > 0 && commentMarkers.map((marker) => {
            const pos = (marker.timestampSeconds / duration) * 100;
            return (
              <div
                key={marker.id}
                className="absolute top-1/2 -translate-y-1/2 w-1 h-1 bg-bb-accent rounded-full pointer-events-auto z-[1]"
                style={{ left: `${pos}%` }}
                onMouseEnter={() => setHoveredMarker(marker)}
                onMouseLeave={() => setHoveredMarker(null)}
              />
            );
          })}

          {/* Comment marker tooltip */}
          {hoveredMarker && duration > 0 && (
            <div
              className="absolute -top-12 -translate-x-1/2 bg-card text-foreground text-xs px-3 py-1.5 rounded shadow-lg pointer-events-none z-20 max-w-[200px]"
              style={{ left: `${(hoveredMarker.timestampSeconds / duration) * 100}%` }}
            >
              <p className="text-bb-accent font-semibold truncate">{hoveredMarker.displayName}</p>
              <p className="truncate">{hoveredMarker.text}</p>
            </div>
          )}

          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progress}% - 7px)` }}
          />

          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 bg-card text-foreground text-xs px-2 py-1 rounded pointer-events-none"
              style={{ left: hoverX }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: time */}
          <div className="text-foreground text-xs md:text-sm tabular-nums whitespace-nowrap select-none">
            {formatTime(isSeeking ? seekTime : currentTime)} / {formatTime(duration)}
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-1">
            {/* Extra controls (emoji picker in watch-together mode) */}
            {extraControls}

            {/* Subtitles */}
            <SubtitleSelector
              tracks={subtitles}
              activeId={activeSubtitleId}
              onChange={onSubtitleChange}
            />

            {/* Keyboard shortcuts help */}
            <button
              type="button"
              onClick={onShowHelp}
              className={controlBtnClass}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-5 h-5 text-foreground" />
            </button>

            {/* PiP */}
            <button
              type="button"
              onClick={onPipToggle}
              className={cn(controlBtnClass, isPip && 'text-primary')}
              aria-label={isPip ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
              title="Picture-in-Picture (P)"
            >
              <PictureInPicture2 className={cn('w-5 h-5', isPip ? 'text-primary' : 'text-foreground')} />
            </button>

            {/* Half-screen toggle */}
            <button
              type="button"
              onClick={() =>
                onViewModeChange(viewMode === 'half-screen' ? 'normal' : 'half-screen')
              }
              className={cn(controlBtnClass, viewMode === 'half-screen' && 'text-primary')}
              aria-label={viewMode === 'half-screen' ? 'Exit half-screen' : 'Half-screen'}
              title="Half-screen (H)"
            >
              <SplitSquareVertical
                className={cn('w-5 h-5', viewMode === 'half-screen' ? 'text-primary' : 'text-foreground')}
              />
            </button>

            {/* Volume */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
                setShowVolume(true);
              }}
              onMouseLeave={() => {
                volumeTimeoutRef.current = setTimeout(() => setShowVolume(false), 300);
              }}
            >
              <button
                type="button"
                onClick={onMuteToggle}
                className={controlBtnClass}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-foreground" />
                ) : (
                  <Volume2 className="w-5 h-5 text-foreground" />
                )}
              </button>

              {/* Volume slider popup */}
              {showVolume && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border border-border rounded-lg p-2 shadow-lg">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-24 h-1 appearance-none bg-secondary rounded-full cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    aria-label="Volume"
                  />
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={onFullscreenToggle}
              className={controlBtnClass}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-foreground" />
              ) : (
                <Maximize className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
