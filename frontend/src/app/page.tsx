'use client';

import { useState, useEffect, useMemo } from 'react';
import { Film } from 'lucide-react';
import { HeroBanner } from '@/components/media/HeroBanner';
import { MediaRow } from '@/components/media/MediaRow';
import { ContinueWatchingRow } from '@/components/watch/ContinueWatchingRow';
import { useAuth } from '@/hooks/useAuth';

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

interface MediaResponse {
  success: boolean;
  data: {
    items: Media[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

async function fetchMediaByType(type?: string): Promise<Media[]> {
  try {
    const url = type
      ? `/api/media?type=${type}&pageSize=20`
      : `/api/media?pageSize=20`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json: MediaResponse = await res.json();
    return json.success ? json.data.items : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const { user } = useAuth();
  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMedia() {
      setIsLoading(true);
      setError(null);
      try {
        const items = await fetchMediaByType();
        if (!cancelled) {
          setAllMedia(items);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load media library. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMedia();
    return () => { cancelled = true; };
  }, []);

  const movies = useMemo(
    () => allMedia.filter((m) => m.type === 'movie'),
    [allMedia],
  );
  const shows = useMemo(
    () => allMedia.filter((m) => m.type === 'show'),
    [allMedia],
  );
  const music = useMemo(
    () => allMedia.filter((m) => m.type === 'music'),
    [allMedia],
  );
  const games = useMemo(
    () => allMedia.filter((m) => m.type === 'game'),
    [allMedia],
  );
  const recentlyAdded = useMemo(
    () =>
      [...allMedia]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 20),
    [allMedia],
  );

  // Pick a random movie or show for the hero
  const heroMedia = useMemo(() => {
    const candidates = allMedia.filter(
      (m) => m.type === 'movie' || m.type === 'show',
    );
    if (candidates.length === 0) return undefined;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [allMedia]);

  const isEmpty = !isLoading && allMedia.length === 0;

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-bb-accent text-black font-semibold rounded-md hover:bg-bb-accent-hover transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Banner */}
      {isLoading ? (
        <div className="h-[50vh] md:h-[70vh] bg-gradient-to-b from-bb-blue/20 to-background animate-pulse" />
      ) : (
        <HeroBanner media={heroMedia} />
      )}

      {/* Content Rows */}
      <div className="px-4 md:px-8 lg:px-12 pb-16 -mt-8 relative z-10 flex flex-col gap-8">
        {isEmpty ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Your library is empty
            </h2>
            <p className="text-muted-foreground">
              Add media files to <code className="bg-card px-2 py-0.5 rounded text-sm">/media</code> and run a scan.
            </p>
          </div>
        ) : (
          <>
            {/* Continue Watching - first row */}
            {user && (
              <p className="text-lg font-medium text-foreground">
                Welcome back, {user.displayName}!
              </p>
            )}

            <ContinueWatchingRow />

            <MediaRow
              title="Recently Added"
              items={recentlyAdded}
              isLoading={isLoading}
            />
            <MediaRow title="Movies" items={movies} isLoading={isLoading} />
            <MediaRow title="TV Shows" items={shows} isLoading={isLoading} />
            <MediaRow title="Music" items={music} isLoading={isLoading} />
            <MediaRow title="Games" items={games} isLoading={isLoading} />
          </>
        )}
      </div>
    </main>
  );
}
