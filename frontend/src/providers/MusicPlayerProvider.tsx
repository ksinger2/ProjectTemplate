'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  posterUrl: string | null;
  durationSeconds: number | null;
  albumId?: string;
  albumTitle?: string;
  /** When true, the id refers to an episode and we use the episode stream endpoint */
  isEpisode?: boolean;
}

export interface MusicPlayerState {
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface MusicPlayerActions {
  play: (track: MusicTrack, playlist?: MusicTrack[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  close: () => void;
}

export type MusicPlayerContextValue = MusicPlayerState & MusicPlayerActions;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function useMusicPlayer(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return ctx;
}

// Optional hook that returns null when outside provider (safe for components
// that might render outside the provider tree during SSR)
export function useMusicPlayerOptional(): MusicPlayerContextValue | null {
  return useContext(MusicPlayerContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export function MusicPlayerProvider({ children }: MusicPlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for latest values in callbacks
  const playlistRef = useRef<MusicTrack[]>([]);
  const currentTrackRef = useRef<MusicTrack | null>(null);
  const closedRef = useRef(false);
  const loadAbortRef = useRef<AbortController | null>(null);
  playlistRef.current = playlist;
  currentTrackRef.current = currentTrack;

  // Initialize audio element once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    // Time update for progress tracking
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      if (closedRef.current) return;
      setIsPlaying(false);
      // Auto-advance to next track
      const pl = playlistRef.current;
      const ct = currentTrackRef.current;
      if (ct && pl.length > 0) {
        const idx = pl.findIndex((t) => t.id === ct.id);
        if (idx >= 0 && idx < pl.length - 1) {
          // There's a next track — play it
          const nextTrack = pl[idx + 1];
          // We need to call playTrack but can't call the state setter version
          // directly from here. Use a custom event instead.
          window.dispatchEvent(
            new CustomEvent('bb-music-next', { detail: nextTrack })
          );
        }
      }
    };

    const onError = () => {
      // Ignore errors triggered by intentionally clearing audio src on close
      if (closedRef.current) return;
      setError('Failed to play this track. Please try again.');
      setIsPlaying(false);
      setIsLoading(false);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onPlaying = () => {
      if (closedRef.current) return;
      setIsPlaying(true);
      setIsLoading(false);
    };

    const onWaiting = () => {
      if (closedRef.current) return;
      setIsLoading(true);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Fetch signed stream URL and start playback
  const loadAndPlay = useCallback(async (track: MusicTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Abort any in-flight load request
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    closedRef.current = false;
    setIsLoading(true);
    setError(null);
    setCurrentTime(0);
    setDuration(0);

    try {
      // Fetch signed stream URL — use episode endpoint for tracks that are episodes
      const streamEndpoint = track.isEpisode
        ? `/api/episodes/${track.id}/stream-url`
        : `/api/media/${track.id}/stream-url`;

      const res = await fetch(streamEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error('Failed to get stream URL');
      }

      const json = await res.json();
      if (!json.success || !json.data?.url) {
        throw new Error('Invalid stream URL response');
      }

      // If closed while we were fetching, don't start playback
      if (closedRef.current || controller.signal.aborted) return;

      // Set source and play
      audio.src = json.data.url;
      audio.load();
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      // Ignore abort errors from intentional cancellation
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (closedRef.current) return;
      const message =
        err instanceof Error ? err.message : 'Failed to play track';
      setError(message);
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, []);

  // Play a track (optionally with a new playlist)
  const play = useCallback(
    (track: MusicTrack, newPlaylist?: MusicTrack[]) => {
      setCurrentTrack(track);
      if (newPlaylist) {
        setPlaylist(newPlaylist);
      }
      loadAndPlay(track);
    },
    [loadAndPlay]
  );

  // Listen for auto-advance events from the ended handler
  useEffect(() => {
    const handler = (e: Event) => {
      const track = (e as CustomEvent<MusicTrack>).detail;
      if (track) {
        play(track);
      }
    };
    window.addEventListener('bb-music-next', handler);
    return () => window.removeEventListener('bb-music-next', handler);
  }, [play]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {
      // Browser may block autoplay
      setError('Playback was blocked. Please try again.');
    });
  }, []);

  const next = useCallback(() => {
    const ct = currentTrackRef.current;
    const pl = playlistRef.current;
    if (!ct || pl.length === 0) return;

    const idx = pl.findIndex((t) => t.id === ct.id);
    if (idx >= 0 && idx < pl.length - 1) {
      play(pl[idx + 1]);
    }
  }, [play]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    const ct = currentTrackRef.current;
    const pl = playlistRef.current;

    // If more than 3 seconds in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (!ct || pl.length === 0) return;
    const idx = pl.findIndex((t) => t.id === ct.id);
    if (idx > 0) {
      play(pl[idx - 1]);
    } else if (audio) {
      // First track — restart
      audio.currentTime = 0;
    }
  }, [play]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const close = useCallback(() => {
    // Mark as closed so in-flight loads and error events are ignored
    closedRef.current = true;
    // Abort any pending stream URL fetch
    loadAbortRef.current?.abort();
    loadAbortRef.current = null;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // Reset the audio element cleanly
    }
    setCurrentTrack(null);
    setPlaylist([]);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsLoading(false);
  }, []);

  // Pause music when a video element starts playing anywhere on the page
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVideoPlay = (e: Event) => {
      const target = e.target;
      if (target instanceof HTMLVideoElement && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    document.addEventListener('play', handleVideoPlay, true);
    return () => document.removeEventListener('play', handleVideoPlay, true);
  }, []);

  const value: MusicPlayerContextValue = {
    currentTrack,
    playlist,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    error,
    play,
    pause,
    resume,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    close,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
