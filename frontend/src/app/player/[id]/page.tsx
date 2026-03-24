'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { SubtitleTrack } from '@/components/player/SubtitleSelector';

// Dynamic import — no SSR for the video player
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
  durationSeconds: number | null;
}

export default function PlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;
  const episodeId = searchParams?.get('episode') ?? undefined;

  const [media, setMedia] = useState<MediaData | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [initialPosition, setInitialPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mediaIdRef = useRef(id);
  const episodeIdRef = useRef(episodeId);

  // Fetch all data needed for playback
  useEffect(() => {
    if (!id) return;
    mediaIdRef.current = id;
    episodeIdRef.current = episodeId;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch media detail, stream URL, subtitles, and watch history in parallel
        const [mediaRes, streamRes, subtitleRes, historyRes] = await Promise.all([
          fetch(`/api/media/${id}`, { credentials: 'include' }),
          fetch(`/api/media/${id}/stream-url`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }),
          fetch(`/api/subtitles/${id}`, { credentials: 'include' }).catch(() => null),
          fetch(`/api/watch-history?status=in_progress`, { credentials: 'include' }).catch(() => null),
        ]);

        if (cancelled) return;

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

        // Subtitles
        if (subtitleRes && subtitleRes.ok) {
          try {
            const subJson = await subtitleRes.json();
            if (subJson.success && Array.isArray(subJson.data)) {
              const tracks: SubtitleTrack[] = subJson.data.map((s: { id: string; language: string; label?: string }) => ({
                id: s.id,
                language: s.language,
                label: s.label || s.language.toUpperCase(),
                src: `/api/subtitles/${s.id}/serve`,
              }));
              setSubtitleTracks(tracks);
            }
          } catch {
            // Subtitles are optional, don't fail
          }
        }

        // Watch history — find initial position
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
      } catch {
        if (!cancelled) setError('Unable to connect to the server.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, episodeId]);

  // Position update handler — sends to API every 10s (triggered by VideoPlayer)
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
        // Silently fail — next update will retry
      });
    },
    [media?.durationSeconds],
  );

  const handleEnded = useCallback(() => {
    // Mark as completed
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
        positionSeconds: dur,
        durationSeconds: dur,
      }),
    }).catch(() => {});
  }, [media?.durationSeconds]);

  const handleBack = useCallback(() => {
    router.push(`/media/${id}`);
  }, [router, id]);

  // Build display title
  const displayTitle = media?.title ?? 'Loading...';

  // Error state
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
    <div className="fixed inset-0 z-50 bg-black">
      {isLoading || !streamUrl ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-foreground animate-spin" />
        </div>
      ) : (
        <VideoPlayer
          src={streamUrl}
          title={displayTitle}
          subtitles={subtitleTracks}
          initialPosition={initialPosition}
          onPositionUpdate={handlePositionUpdate}
          onEnded={handleEnded}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
