'use client';

import { MediaCard } from '@/components/media/MediaCard';
import { MediaCardSkeleton } from '@/components/media/MediaCardSkeleton';
import { cn } from '@/lib/utils';

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

interface MediaGridProps {
  items: Media[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function MediaGrid({ items, isLoading, emptyMessage = 'No media found' }: MediaGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid gap-4',
          'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
        )}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <MediaCardSkeleton key={i} size="md" className="w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-4',
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
      )}
    >
      {items.map((item) => (
        <div key={item.id} className="w-full">
          <MediaCard media={item} size="md" />
        </div>
      ))}
    </div>
  );
}
