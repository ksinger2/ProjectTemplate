'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Film, Tv, Music, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchBar } from '@/components/search/SearchBar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

type MediaType = 'all' | 'movie' | 'show' | 'music' | 'game';

const FILTERS: { label: string; value: MediaType; icon?: React.ReactNode }[] = [
  { label: 'All', value: 'all' },
  { label: 'Movies', value: 'movie', icon: <Film className="size-3.5" /> },
  { label: 'Shows', value: 'show', icon: <Tv className="size-3.5" /> },
  { label: 'Music', value: 'music', icon: <Music className="size-3.5" /> },
  { label: 'Games', value: 'game', icon: <Gamepad2 className="size-3.5" /> },
];

const TYPE_LABELS: Record<string, string> = {
  movie: 'Movie',
  show: 'Show',
  music: 'Music',
  game: 'Game',
};

function ResultCard({ media }: { media: Media }) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = `/api/media/${media.id}/thumbnail`;
  const showPoster = media.posterUrl !== null && !imgError;

  return (
    <Link
      href={`/media/${media.id}`}
      className={cn(
        'group relative rounded-lg overflow-hidden bg-card border border-border',
        'hover:border-primary/40 transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
      )}
    >
      <div className="aspect-[2/3] w-full relative bg-secondary">
        {showPoster ? (
          <img
            src={thumbnailUrl}
            alt={media.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-card flex items-center justify-center">
            <Film className="size-8 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <p className="text-sm font-semibold text-foreground truncate">{media.title}</p>
        <div className="flex items-center gap-2">
          {media.year && (
            <span className="text-xs text-muted-foreground">{media.year}</span>
          )}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {TYPE_LABELS[media.type] || media.type}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MediaType>('all');

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);

    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/media/search?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setResults(json.data);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredResults =
    activeFilter === 'all'
      ? results
      : results.filter((m) => m.type === activeFilter);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search bar */}
        <SearchBar onSearch={handleSearch} defaultExpanded className="w-full" />

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by type">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={activeFilter === f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80',
              )}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <SkeletonGrid />
        ) : !hasSearched ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="size-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground">
              Search for movies, shows, music, and games
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Start typing to find something to watch
            </p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="size-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try different keywords or remove filters
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredResults.map((media) => (
                <ResultCard key={media.id} media={media} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
