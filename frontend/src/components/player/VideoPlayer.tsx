'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Hls from 'hls.js';
import { PlayerControls, type CommentMarker } from './PlayerControls';
import { KeyboardShortcutHelp } from './KeyboardShortcutHelp';
import type { SubtitleTrack } from './SubtitleSelector';

export type ViewMode = 'normal' | 'fullscreen' | 'half-screen';

interface VideoPlayerProps {
  src: string;
  title: string;
  subtitles?: SubtitleTrack[];
  initialPosition?: number;
  onPositionUpdate?: (seconds: number) => void;
  onEnded?: () => void;
  onBack?: () => void;
  /** Content rendered below the video in half-screen mode */
  halfScreenContent?: React.ReactNode;
  /** Extra controls injected into the player control bar (e.g., emoji picker) */
  extraControls?: React.ReactNode;
  /** Callback when play/pause/seek occurs (for watch-together sync) */
  onSyncPlay?: () => void;
  onSyncPause?: () => void;
  onSyncSeek?: (position: number) => void;
  /** Ref to get the underlying video element for external sync control */
  videoRef?: React.MutableRefObject<HTMLVideoElement | null>;
  /** Intro skip markers (in seconds) */
  introStart?: number;
  introEnd?: number;
  /** Comment markers for the seek bar */
  commentMarkers?: CommentMarker[];
  /** Content rendered above the controls (e.g., comments overlay) */
  overlayContent?: React.ReactNode;
}

export function VideoPlayer({
  src,
  title,
  subtitles = [],
  initialPosition = 0,
  onPositionUpdate,
  onEnded,
  onBack,
  halfScreenContent,
  extraControls,
  onSyncPlay,
  onSyncPause,
  onSyncSeek,
  videoRef: externalVideoRef,
  introStart,
  introEnd,
  commentMarkers,
  overlayContent,
}: VideoPlayerProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const positionTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const hasSetInitialPosition = useRef(false);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [activeSubtitleId, setActiveSubtitleId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);

  // ---- HLS.js integration ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = src.endsWith('.m3u8') || src.includes('.m3u8?');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Ready to play
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
    } else {
      // Standard video source
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // Show controls and start hide timer
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 3000);
  }, []);

  // Play/Pause
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      onSyncPlay?.();
    } else {
      video.pause();
      onSyncPause?.();
    }
  }, [onSyncPlay, onSyncPause]);

  // Seek
  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    onSyncSeek?.(time);
  }, [onSyncSeek]);

  // Skip back/forward
  const handleSkipBack = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  }, []);

  const handleSkipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
  }, []);

  // Volume
  const handleVolumeChange = useCallback((v: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    setVolume(v);
    if (v > 0 && video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Fullscreen
  const handleFullscreenToggle = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  }, []);

  // PiP toggle
  const handlePipToggle = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP not supported or denied
    }
  }, []);

  // View mode toggle
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    if (mode === 'fullscreen') {
      const container = containerRef.current;
      if (!container) return;
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => {});
      }
      setViewMode('fullscreen');
    } else if (mode === 'half-screen') {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setViewMode('half-screen');
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setViewMode('normal');
    }
  }, []);

  // Subtitle change
  const handleSubtitleChange = useCallback((id: string | null) => {
    const video = videoRef.current;
    if (!video) return;
    setActiveSubtitleId(id);
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      const trackId = subtitles[i]?.id;
      track.mode = trackId === id ? 'showing' : 'hidden';
    }
  }, [subtitles]);

  // Skip intro
  const handleSkipIntro = useCallback(() => {
    const video = videoRef.current;
    if (!video || introEnd == null) return;
    video.currentTime = introEnd;
    setShowSkipIntro(false);
    onSyncSeek?.(introEnd);
  }, [introEnd, onSyncSeek]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => { setIsPlaying(true); showControls(); };
    const onPause = () => { setIsPlaying(false); setControlsVisible(true); };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (introStart != null && introEnd != null && introEnd > introStart) {
        setShowSkipIntro(video.currentTime >= introStart && video.currentTime < introEnd);
      }
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onEnded = () => {
      setIsPlaying(false);
      setControlsVisible(true);
    };
    const onFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs) {
        setViewMode('fullscreen');
      } else {
        setViewMode((prev) => (prev === 'fullscreen' ? 'normal' : prev));
      }
    };
    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      if (initialPosition > 0 && !hasSetInitialPosition.current) {
        video.currentTime = initialPosition;
        hasSetInitialPosition.current = true;
      }
    };
    const onEnterpip = () => setIsPip(true);
    const onLeavepip = () => setIsPip(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('progress', onProgress);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('ended', onEnded);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('enterpictureinpicture', onEnterpip);
    video.addEventListener('leavepictureinpicture', onLeavepip);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('enterpictureinpicture', onEnterpip);
      video.removeEventListener('leavepictureinpicture', onLeavepip);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosition, showControls, introStart, introEnd]);

  // Position update interval (every 10 seconds)
  useEffect(() => {
    positionTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0) {
        onPositionUpdate?.(video.currentTime);
      }
    }, 10000);
    return () => {
      if (positionTimerRef.current) clearInterval(positionTimerRef.current);
    };
  }, [onPositionUpdate]);

  // Ended callback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => onEnded?.();
    video.addEventListener('ended', handler);
    return () => video.removeEventListener('ended', handler);
  }, [onEnded]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleFullscreenToggle();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          handlePipToggle();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          setViewMode((prev) => (prev === 'half-screen' ? 'normal' : 'half-screen'));
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          break;
        case '?':
          e.preventDefault();
          setShowHelp((prev) => !prev);
          break;
        case 'Escape':
          if (showHelp) {
            e.preventDefault();
            setShowHelp(false);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkipBack();
          showControls();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkipForward();
          showControls();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          showControls();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          showControls();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleFullscreenToggle, handleMuteToggle, handlePipToggle, handleSkipBack, handleSkipForward, handleVolumeChange, volume, showControls, showHelp]);

  // Anti-download: block right-click and Ctrl+S
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventContext = (e: Event) => e.preventDefault();
    const preventSave = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    container.addEventListener('contextmenu', preventContext);
    window.addEventListener('keydown', preventSave);
    return () => {
      container.removeEventListener('contextmenu', preventContext);
      window.removeEventListener('keydown', preventSave);
    };
  }, []);

  // Handle mouse movement for controls visibility
  const handleMouseMove = useCallback(() => {
    showControls();
  }, [showControls]);

  // Touch: tap to show/hide, double-tap sides to skip
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[role="slider"]') || target.closest('[role="listbox"]')) return;

      const now = Date.now();
      const touch = e.changedTouches[0];
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const tapGap = now - lastTapRef.current.time;

      if (tapGap < 300 && Math.abs(x - lastTapRef.current.x) < 50) {
        if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
        const third = rect.width / 3;
        if (x < third) {
          handleSkipBack();
        } else if (x > third * 2) {
          handleSkipForward();
        }
        lastTapRef.current = { time: 0, x: 0 };
      } else {
        lastTapRef.current = { time: now, x };
        doubleTapTimerRef.current = setTimeout(() => {
          setControlsVisible((v) => !v);
        }, 300);
      }
    },
    [handleSkipBack, handleSkipForward],
  );

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
    };
  }, []);

  const isHalfScreen = viewMode === 'half-screen';

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black select-none ${isHalfScreen ? 'h-auto flex flex-col' : 'h-full'}`}
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video area */}
      <div className={`relative ${isHalfScreen ? 'h-[50vh]' : 'w-full h-full'}`}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          playsInline
          controlsList="nodownload"
          disablePictureInPicture={false}
          preload="auto"
          onClick={handlePlayPause}
        >
          {subtitles.map((sub) => (
            <track
              key={sub.id}
              kind="subtitles"
              label={sub.label}
              srcLang={sub.language}
              src={sub.src}
            />
          ))}
        </video>

        {/* Buffering spinner overlay */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-12 h-12 border-4 border-bb-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Controls overlay */}
        <PlayerControls
          title={title}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          volume={volume}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          isPip={isPip}
          viewMode={viewMode}
          subtitles={subtitles}
          activeSubtitleId={activeSubtitleId}
          visible={controlsVisible}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onSkipBack={handleSkipBack}
          onSkipForward={handleSkipForward}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          onFullscreenToggle={handleFullscreenToggle}
          onPipToggle={handlePipToggle}
          onViewModeChange={handleViewModeChange}
          onSubtitleChange={handleSubtitleChange}
          onBack={onBack ?? (() => {})}
          onShowHelp={() => setShowHelp(true)}
          extraControls={extraControls}
          commentMarkers={commentMarkers}
        />

        {/* Overlay content (e.g., timed comments) */}
        {overlayContent}

        {/* Skip Intro button */}
        {showSkipIntro && (
          <button
            onClick={handleSkipIntro}
            className="absolute bottom-24 right-8 z-30 px-6 py-3
              bg-black/70 text-white font-semibold text-sm rounded-md
              border border-bb-accent hover:bg-black/90 transition-all"
          >
            Skip Intro
          </button>
        )}
      </div>

      {/* Half-screen content area */}
      {isHalfScreen && halfScreenContent && (
        <div className="flex-1 min-h-[50vh] overflow-y-auto bg-[var(--bb-background,#0a1628)]">
          {halfScreenContent}
        </div>
      )}

      {/* Keyboard shortcut help overlay */}
      {showHelp && (
        <KeyboardShortcutHelp onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}
