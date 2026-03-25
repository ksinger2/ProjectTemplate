'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, Play, X, Users } from 'lucide-react';
import type { SubtitleTrack } from '@/components/player/SubtitleSelector';
import type { Episode } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { WatchTogetherOverlay } from '@/components/player/WatchTogetherOverlay';
import { EmojiPicker } from '@/components/player/EmojiPicker';
import { EmojiBurstOverlay, useEmojiBurst } from '@/components/player/EmojiBurst';
import { CommentsOverlay, type TimedComment } from '@/components/player/CommentsOverlay';
import { CommentInput } from '@/components/player/CommentInput';
import { LiveChat } from '@/components/player/LiveChat';
import type { CommentMarker } from '@/components/player/PlayerControls';

// Dynamic import -- no SSR for the video player
const VideoPlayer = dynamic(
  () => import('@/components/player/VideoPlayer').then((mod) => ({ default: mod.VideoPlayer })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-foreground animate-spin" />
      </div>
    ),
  },
);

interface MediaData {
  id: string;
  title: string;
  type: string;
  description?: string;
  durationSeconds: number | null;
}

// --------------------------------------------------------------------------
// Next-Episode Countdown Overlay
// --------------------------------------------------------------------------

function NextEpisodeOverlay({
  nextEpisode,
  onPlayNow,
  onCancel,
}: {
  nextEpisode: Episode;
  onPlayNow: () => void;
  onCancel: () => void;
}) {
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onPlayNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const episodeLabel = `S${nextEpisode.seasonNumber}E${nextEpisode.episodeNumber}`;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 text-center px-6 max-w-md">
        <p className="text-white/60 text-sm uppercase tracking-wider font-medium">
          Next episode in {countdown}s
        </p>
        <h3 className="text-white text-xl md:text-2xl font-bold">
          {episodeLabel}: {nextEpisode.title}
        </h3>
        {nextEpisode.description && (
          <p className="text-white/50 text-sm line-clamp-2">{nextEpisode.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={onPlayNow}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--bb-accent,#FFD100)] text-black font-semibold rounded-lg hover:brightness-110 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            Play Now
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Half-screen episode list
// --------------------------------------------------------------------------

function EpisodeList({
  episodes,
  currentEpisodeId,
  mediaTitle,
  onSelect,
}: {
  episodes: Episode[];
  currentEpisodeId?: string;
  mediaTitle: string;
  onSelect: (ep: Episode) => void;
}) {
  // Group by season
  const seasons = episodes.reduce<Record<number, Episode[]>>((acc, ep) => {
    (acc[ep.seasonNumber] ??= []).push(ep);
    return acc;
  }, {});
  const sortedSeasons = Object.keys(seasons)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="p-4 md:p-6">
      <h3 className="text-white text-lg font-bold mb-4">{mediaTitle}</h3>
      {sortedSeasons.map((season) => (
        <div key={season} className="mb-6">
          <h4 className="text-white/60 text-xs uppercase tracking-wider font-semibold mb-2">
            Season {season}
          </h4>
          <div className="flex flex-col gap-1">
            {seasons[season]
              .sort((a, b) => a.episodeNumber - b.episodeNumber)
              .map((ep) => {
                const isActive = ep.id === currentEpisodeId;
                return (
                  <button
                    type="button"
                    key={ep.id}
                    onClick={() => onSelect(ep)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-[var(--bb-accent,#FFD100)]/15 text-[var(--bb-accent,#FFD100)]'
                        : 'hover:bg-white/5 text-white/80'
                    }`}
                  >
                    <span className="text-xs font-mono w-6 text-center opacity-60">
                      {ep.episodeNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ep.title}</p>
                      {ep.duration && (
                        <p className="text-xs opacity-50 mt-0.5">
                          {Math.floor(ep.duration / 60)}m
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Playing
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------------------------------
// Participant type for watch-together
// --------------------------------------------------------------------------
interface WatchParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
}

// --------------------------------------------------------------------------
// Main Player Page
// --------------------------------------------------------------------------

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;
  const episodeId = searchParams?.get('episode') ?? undefined;
  const sessionId = searchParams?.get('session') ?? undefined;

  const { user } = useAuth();
  const { socket, isConnected, emit, on, off } = useSocket();

  const [media, setMedia] = useState<MediaData | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [initialPosition, setInitialPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Episode support
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [nextEpisode, setNextEpisode] = useState<Episode | null>(null);

  // Watch-together state
  const [participants, setParticipants] = useState<WatchParticipant[]>([]);
  const [isSynced, setIsSynced] = useState(true);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const syncLockRef = useRef(false); // prevent recursive sync events

  // Timed comments
  const [comments, setComments] = useState<TimedComment[]>([]);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);

  // Emoji burst
  const { emojis, addEmoji } = useEmojiBurst();

  const mediaIdRef = useRef(id);
  const episodeIdRef = useRef(episodeId);

  const isWatchTogether = !!sessionId;

  // ---------- Determine the next episode ----------
  const findNextEpisode = useCallback(
    (currentEpId?: string): Episode | null => {
      if (!currentEpId || episodes.length === 0) return null;
      const sorted = [...episodes].sort((a, b) =>
        a.seasonNumber !== b.seasonNumber
          ? a.seasonNumber - b.seasonNumber
          : a.episodeNumber - b.episodeNumber,
      );
      const idx = sorted.findIndex((ep) => ep.id === currentEpId);
      if (idx < 0 || idx >= sorted.length - 1) return null;
      return sorted[idx + 1];
    },
    [episodes],
  );

  // ---------- Socket.io watch-together integration ----------
  useEffect(() => {
    if (!isWatchTogether || !sessionId) return;

    // Join the session via socket
    emit('session:join', { sessionId }, (response: unknown) => {
      const res = response as {
        success: boolean;
        data?: { hostId: string };
        error?: string;
      };
      if (res.success && res.data) {
        // Add self as participant
        if (user) {
          setParticipants((prev) => {
            if (prev.some((p) => p.userId === user.id)) return prev;
            return [
              ...prev,
              {
                userId: user.id,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
              },
            ];
          });
        }
      }
    });

    // Listen for sync events
    const unsubPlay = on('sync:play', () => {
      if (syncLockRef.current) return;
      syncLockRef.current = true;
      videoElRef.current?.play().catch(() => {});
      setTimeout(() => {
        syncLockRef.current = false;
      }, 100);
    });

    const unsubPause = on('sync:pause', () => {
      if (syncLockRef.current) return;
      syncLockRef.current = true;
      videoElRef.current?.pause();
      setTimeout(() => {
        syncLockRef.current = false;
      }, 100);
    });

    const unsubSeek = on('sync:seek', (data: unknown) => {
      if (syncLockRef.current) return;
      syncLockRef.current = true;
      const { position } = data as { position: number };
      if (videoElRef.current) {
        videoElRef.current.currentTime = position;
      }
      setTimeout(() => {
        syncLockRef.current = false;
      }, 100);
    });

    const unsubJoined = on('session:joined', (data: unknown) => {
      const { userId, displayName } = data as {
        userId: string;
        displayName: string;
      };
      setParticipants((prev) => {
        if (prev.some((p) => p.userId === userId)) return prev;
        return [...prev, { userId, displayName }];
      });
    });

    const unsubLeft = on('session:participant-left', (data: unknown) => {
      const { userId } = data as { userId: string };
      setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    });

    const unsubEnded = on('session:ended', () => {
      // Session ended by host
      router.push(`/media/${id}`);
    });

    // Heartbeat for drift detection
    const unsubHeartbeat = on('sync:heartbeat', (data: unknown) => {
      const { position } = data as { position: number; userId: string };
      if (videoElRef.current) {
        const drift = Math.abs(videoElRef.current.currentTime - position);
        setIsSynced(drift < 0.5);
        // Force sync if drift > 500ms
        if (drift > 0.5) {
          videoElRef.current.currentTime = position;
          setIsSynced(true);
        }
      }
    });

    // Emoji reactions
    const unsubEmoji = on('emoji:receive', (data: unknown) => {
      const { emoji, displayName } = data as {
        emoji: string;
        userId: string;
        displayName: string;
      };
      addEmoji(emoji, displayName);
    });

    // Send heartbeat every 2s
    heartbeatRef.current = setInterval(() => {
      if (videoElRef.current) {
        emit('sync:heartbeat', {
          position: videoElRef.current.currentTime,
        });
      }
    }, 2000);

    return () => {
      unsubPlay();
      unsubPause();
      unsubSeek();
      unsubJoined();
      unsubLeft();
      unsubEnded();
      unsubHeartbeat();
      unsubEmoji();
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      emit('session:leave');
    };
  }, [isWatchTogether, sessionId, emit, on, off, user, addEmoji, router, id]);

  // ---------- Sync callbacks for VideoPlayer ----------
  const handleSyncPlay = useCallback(() => {
    if (!isWatchTogether || syncLockRef.current) return;
    emit('sync:play');
  }, [isWatchTogether, emit]);

  const handleSyncPause = useCallback(() => {
    if (!isWatchTogether || syncLockRef.current) return;
    emit('sync:pause');
  }, [isWatchTogether, emit]);

  const handleSyncSeek = useCallback(
    (position: number) => {
      if (!isWatchTogether || syncLockRef.current) return;
      emit('sync:seek', { position });
    },
    [isWatchTogether, emit],
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      emit('emoji:send', { emoji });
    },
    [emit],
  );

  const handleLeaveSession = useCallback(() => {
    emit('session:leave');
    router.push(`/media/${id}`);
  }, [emit, router, id]);

  // ---------- Fetch all data needed for playback ----------
  useEffect(() => {
    if (!id) return;
    mediaIdRef.current = id;
    episodeIdRef.current = episodeId;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setShowNextOverlay(false);
      setNextEpisode(null);

      try {
        // Build the stream URL fetch -- episode vs media
        const streamFetchUrl = episodeId
          ? `/api/episodes/${episodeId}/stream-url`
          : `/api/media/${id}/stream-url`;

        // Fetch media detail, stream URL, subtitles, watch history, and episodes in parallel
        const [mediaRes, streamRes, subtitleRes, historyRes, episodesRes] = await Promise.all([
          fetch(`/api/media/${id}`, { credentials: 'include' }),
          fetch(streamFetchUrl, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch(`/api/subtitles/${id}`, { credentials: 'include' }).catch(() => null),
          fetch(`/api/watch-history?status=in_progress`, { credentials: 'include' }).catch(
            () => null,
          ),
          fetch(`/api/media/${id}/episodes`, { credentials: 'include' }).catch(() => null),
        ]);

        if (cancelled) return;

        // Media
        if (!mediaRes.ok) {
          setError(mediaRes.status === 404 ? 'Media not found.' : 'Failed to load media.');
          return;
        }
        const mediaJson = await mediaRes.json();
        if (!mediaJson.success || !mediaJson.data) {
          setError('Failed to load media.');
          return;
        }
        setMedia(mediaJson.data);

        // Stream URL
        if (streamRes.ok) {
          const streamJson = await streamRes.json();
          if (streamJson.success && streamJson.data?.url) {
            setStreamUrl(streamJson.data.url);
          } else {
            setError('Failed to get stream URL.');
            return;
          }
        } else {
          setError('Failed to get stream URL.');
          return;
        }

        // Subtitles (optional)
        if (subtitleRes && subtitleRes.ok) {
          try {
            const subJson = await subtitleRes.json();
            if (subJson.success && Array.isArray(subJson.data)) {
              const tracks: SubtitleTrack[] = subJson.data.map(
                (s: { id: string; language: string; label?: string }) => ({
                  id: s.id,
                  language: s.language,
                  label: s.label || s.language.toUpperCase(),
                  src: `/api/subtitles/${s.id}/serve`,
                }),
              );
              setSubtitleTracks(tracks);
            }
          } catch {
            // Subtitles are optional
          }
        }

        // Watch history -- find initial position
        if (historyRes && historyRes.ok) {
          try {
            const historyJson = await historyRes.json();
            if (historyJson.success && Array.isArray(historyJson.data)) {
              const entry = historyJson.data.find(
                (h: { mediaId: string; episodeId?: string }) =>
                  h.mediaId === id && (!episodeId || h.episodeId === episodeId),
              );
              if (entry && typeof entry.positionSeconds === 'number') {
                setInitialPosition(entry.positionSeconds);
              }
            }
          } catch {
            // History is optional
          }
        }

        // Episodes
        if (episodesRes && episodesRes.ok) {
          try {
            const epJson = await episodesRes.json();
            if (epJson.success && Array.isArray(epJson.data)) {
              setEpisodes(epJson.data);
            }
          } catch {
            // Episodes are optional
          }
        }
      } catch {
        if (!cancelled) setError('Unable to connect to the server.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, episodeId]);

  // ---------- Fetch timed comments ----------
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchComments() {
      try {
        const url = episodeId
          ? `/api/comments/${id}?episodeId=${episodeId}`
          : `/api/comments/${id}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.success && Array.isArray(json.data)) {
          // Normalize: backend returns user as nested object { user: { displayName, avatarUrl } }
          const normalized: TimedComment[] = json.data.map((c: any) => ({
            id: c.id,
            userId: c.userId,
            text: c.text,
            timestampSeconds: c.timestampSeconds,
            createdAt: c.createdAt,
            displayName: c.displayName || c.user?.displayName || 'Anonymous',
            avatarUrl: c.avatarUrl ?? c.user?.avatarUrl ?? null,
          }));
          setComments(normalized);
        }
      } catch {
        // Comments are optional
      }
    }

    fetchComments();
    return () => { cancelled = true; };
  }, [id, episodeId]);

  // ---------- Track current time for comments ----------
  useEffect(() => {
    const video = videoElRef.current;
    if (!video) return;

    const onTimeUpdate = () => setPlayerCurrentTime(video.currentTime);
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [streamUrl]); // re-attach when stream loads

  // ---------- Handle new comment added ----------
  const handleCommentAdded = useCallback((raw: any) => {
    // Normalize: backend returns user as nested object
    const comment: TimedComment = {
      id: raw.id,
      userId: raw.userId,
      text: raw.text,
      timestampSeconds: raw.timestampSeconds,
      createdAt: raw.createdAt,
      displayName: raw.displayName || raw.user?.displayName || 'Anonymous',
      avatarUrl: raw.avatarUrl ?? raw.user?.avatarUrl ?? null,
    };
    setComments((prev) => [...prev, comment]);
  }, []);

  // ---------- Build comment markers for seek bar ----------
  const commentMarkers: CommentMarker[] = useMemo(
    () =>
      comments.map((c) => ({
        id: c.id,
        timestampSeconds: c.timestampSeconds,
        text: c.text,
        displayName: c.displayName,
      })),
    [comments],
  );

  // ---------- Position update handler (every 10s via VideoPlayer) ----------
  const handlePositionUpdate = useCallback(
    (positionSeconds: number) => {
      const currentMediaId = mediaIdRef.current;
      const currentEpisodeId = episodeIdRef.current;
      const dur = media?.durationSeconds;
      if (!currentMediaId || !dur) return;

      fetch('/api/watch-history', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: currentMediaId,
          ...(currentEpisodeId ? { episodeId: currentEpisodeId } : {}),
          positionSeconds: Math.floor(positionSeconds),
          durationSeconds: dur,
        }),
      }).catch(() => {
        // Silently fail -- next update will retry
      });
    },
    [media?.durationSeconds],
  );

  // ---------- Video ended handler ----------
  const handleEnded = useCallback(() => {
    // Mark as completed
    const currentMediaId = mediaIdRef.current;
    const currentEpisodeId = episodeIdRef.current;
    const dur = media?.durationSeconds;
    if (currentMediaId && dur) {
      fetch('/api/watch-history', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: currentMediaId,
          ...(currentEpisodeId ? { episodeId: currentEpisodeId } : {}),
          positionSeconds: dur,
          durationSeconds: dur,
        }),
      }).catch(() => {});
    }

    // Show next episode overlay if applicable
    const next = findNextEpisode(currentEpisodeId);
    if (next) {
      setNextEpisode(next);
      setShowNextOverlay(true);
    }
  }, [media?.durationSeconds, findNextEpisode]);

  // ---------- Navigate to next episode ----------
  const navigateToEpisode = useCallback(
    (ep: Episode) => {
      setShowNextOverlay(false);
      router.push(`/player/${id}?episode=${ep.id}`);
    },
    [router, id],
  );

  const handleNextPlayNow = useCallback(() => {
    if (nextEpisode) navigateToEpisode(nextEpisode);
  }, [nextEpisode, navigateToEpisode]);

  const handleNextCancel = useCallback(() => {
    setShowNextOverlay(false);
    setNextEpisode(null);
  }, []);

  const handleBack = useCallback(() => {
    if (isWatchTogether) {
      emit('session:leave');
    }
    router.push(`/media/${id}`);
  }, [router, id, isWatchTogether, emit]);

  // ---------- Build display title + intro markers ----------
  let displayTitle = media?.title ?? 'Loading...';
  let introStart: number | undefined;
  let introEnd: number | undefined;
  if (episodeId && episodes.length > 0) {
    const currentEp = episodes.find((ep) => ep.id === episodeId);
    if (currentEp) {
      displayTitle = `${media?.title} - S${currentEp.seasonNumber}E${currentEp.episodeNumber}: ${currentEp.title}`;
      introStart = currentEp.introStart;
      introEnd = currentEp.introEnd;
    }
  }

  // ---------- Half-screen content (episode list) ----------
  const halfScreenContent =
    episodes.length > 0 ? (
      <EpisodeList
        episodes={episodes}
        currentEpisodeId={episodeId}
        mediaTitle={media?.title ?? ''}
        onSelect={navigateToEpisode}
      />
    ) : media?.description ? (
      <div className="p-4 md:p-6">
        <h3 className="text-white text-lg font-bold mb-2">{media.title}</h3>
        <p className="text-white/60 text-sm leading-relaxed">{media.description}</p>
      </div>
    ) : undefined;

  // ---------- Emoji picker handler (works in solo and watch-together mode) ----------
  const handleSoloEmojiSelect = useCallback(
    (emoji: string) => {
      if (isWatchTogether) {
        handleEmojiSelect(emoji);
      } else {
        // Solo mode: just show the emoji burst locally
        addEmoji(emoji, user?.displayName);
      }
    },
    [isWatchTogether, handleEmojiSelect, addEmoji, user?.displayName],
  );

  // ---------- Extra controls (emoji picker -- always visible) ----------
  const extraControls = (
    <EmojiPicker onSelect={handleSoloEmojiSelect} />
  );

  // ---------- Error state ----------
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-bold text-foreground mb-2">Playback Error</h1>
        <p className="text-muted-foreground mb-6 text-center">{error}</p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-primary hover:text-bb-accent-hover transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-auto">
      {isLoading || !streamUrl ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-foreground animate-spin" />
        </div>
      ) : (
        <div className="relative w-full h-full">
          <VideoPlayer
            src={streamUrl}
            title={displayTitle}
            subtitles={subtitleTracks}
            initialPosition={initialPosition}
            onPositionUpdate={handlePositionUpdate}
            onEnded={handleEnded}
            onBack={handleBack}
            halfScreenContent={halfScreenContent}
            extraControls={extraControls}
            introStart={introStart}
            introEnd={introEnd}
            onSyncPlay={handleSyncPlay}
            onSyncPause={handleSyncPause}
            onSyncSeek={handleSyncSeek}
            videoRef={videoElRef}
            commentMarkers={commentMarkers}
            overlayContent={
              <CommentsOverlay
                comments={comments}
                currentTime={playerCurrentTime}
              />
            }
          />

          {/* Watch Together overlay or start button */}
          {isWatchTogether ? (
            <WatchTogetherOverlay
              participants={participants}
              isSynced={isSynced}
              isConnected={isConnected}
              visible={true}
              onLeave={handleLeaveSession}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                // Create a new watch-together session via the API
                fetch('/api/sessions', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mediaId: id, episodeId }),
                })
                  .then((res) => res.json())
                  .then((json) => {
                    if (json.success && json.data?.sessionId) {
                      const ep = episodeId ? `&episode=${episodeId}` : '';
                      router.push(`/player/${id}?session=${json.data.sessionId}${ep}`);
                    }
                  })
                  .catch(() => {});
              }}
              className="absolute top-16 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors backdrop-blur-sm"
              title="Start a Watch Together session"
            >
              <Users className="size-3.5" />
              Watch Together
            </button>
          )}

          {/* Live Chat toggle button */}
          <button
            type="button"
            onClick={() => setIsChatOpen((prev) => !prev)}
            className="absolute top-16 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors backdrop-blur-sm"
            title="Toggle Live Chat"
          >
            💬 Chat
          </button>

          {/* Live Chat panel */}
          <LiveChat
            mediaId={id}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />

          {/* Emoji burst animations (visible in both solo and watch-together mode) */}
          <EmojiBurstOverlay emojis={emojis} />

          {/* Timed comment input */}
          <div className="absolute bottom-20 left-4 right-4 z-30 pointer-events-none [&>*]:pointer-events-auto">
            <CommentInput
              mediaId={id}
              episodeId={episodeId}
              currentTime={playerCurrentTime}
              onCommentAdded={handleCommentAdded}
            />
          </div>

          {/* Next episode auto-advance overlay */}
          {showNextOverlay && nextEpisode && (
            <NextEpisodeOverlay
              nextEpisode={nextEpisode}
              onPlayNow={handleNextPlayNow}
              onCancel={handleNextCancel}
            />
          )}
        </div>
      )}
    </div>
  );
}
