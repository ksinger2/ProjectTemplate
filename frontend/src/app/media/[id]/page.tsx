'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { MediaDetailView } from '@/components/media/MediaDetail';

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

interface Episode {
  id: string;
  showId: string;
  season: number;
  episode: number;
  title: string;
  description: string | null;
  filePath: string;
  durationSeconds: number | null;
}

interface Subtitle {
  id: string;
  mediaId: string;
  episodeId: string | null;
  language: string;
  label: string;
  filePath: string;
}

interface MediaDetail extends Media {
  episodes?: Episode[];
  subtitles?: Subtitle[];
}

function MediaDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="relative w-full h-[40vh] md:h-[50vh]">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none bg-card" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 md:px-12 md:pb-10 space-y-3">
          <Skeleton className="h-10 w-80 max-w-full bg-secondary" />
          <Skeleton className="h-4 w-48 bg-secondary" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24 bg-secondary" />
            <Skeleton className="h-10 w-10 bg-secondary" />
            <Skeleton className="h-10 w-10 bg-secondary" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="px-4 md:px-12 py-6 space-y-4">
        <Skeleton className="h-4 w-full max-w-2xl bg-card" />
        <Skeleton className="h-4 w-3/4 max-w-xl bg-card" />
        <Skeleton className="h-4 w-1/2 max-w-md bg-card" />
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-6 w-16 rounded-full bg-card" />
          <Skeleton className="h-6 w-20 rounded-full bg-card" />
          <Skeleton className="h-6 w-14 rounded-full bg-card" />
        </div>
      </div>
    </div>
  );
}

export default function MediaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchMedia() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/media/${id}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError('not_found');
          } else {
            setError('Something went wrong. Please try again.');
          }
          return;
        }

        const json = await res.json();
        if (json.success && json.data) {
          setMedia(json.data);
        } else {
          setError('Failed to load media details.');
        }
      } catch {
        setError('Unable to connect to the server.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMedia();
  }, [id]);

  if (isLoading) {
    return (
      <main>
        {/* Back button visible during loading */}
        <div className="fixed top-4 left-4 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
        <MediaDetailSkeleton />
      </main>
    );
  }

  if (error === 'not_found') {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This title could not be found. It may have been removed from the library.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-bb-accent-hover transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </main>
    );
  }

  if (error || !media) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          {error || 'Unable to load media details.'}
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-primary hover:text-bb-accent-hover transition-colors font-medium"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Back button */}
      <div className="fixed top-4 left-4 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors bg-background/60 backdrop-blur-sm rounded-md px-2 py-1"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <MediaDetailView
        media={media}
        onPlay={(episodeId) => {
          if (media.type === 'game') {
            router.push(`/games/${media.id}`);
          } else {
            const url = episodeId
              ? `/player/${media.id}?episode=${episodeId}`
              : `/player/${media.id}`;
            router.push(url);
          }
        }}
      />
    </main>
  );
}
