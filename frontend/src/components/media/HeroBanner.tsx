'use client';

import { Play, Info } from 'lucide-react';
import Link from 'next/link';
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

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

interface HeroBannerProps {
  media?: Media;
}

export function HeroBanner({ media }: HeroBannerProps) {
  if (!media) {
    return (
      <section className="relative h-[50vh] md:h-[70vh] flex items-center justify-center bg-gradient-to-b from-bb-blue/20 via-bb-background to-background">
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 text-center px-6">
          <div
            className="inline-block bg-bb-blue rounded-lg px-8 py-4 mb-6 border border-bb-accent/30"
            style={{
              boxShadow: '0 0 30px rgba(255, 209, 0, 0.15), 0 0 60px rgba(255, 209, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h1
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-bb-accent"
              style={{
                textShadow: '0 0 20px rgba(255, 209, 0, 0.6), 0 0 40px rgba(255, 209, 0, 0.3)',
              }}
            >
              BLOCKBUSTER
            </h1>
          </div>
          <p className="text-xl text-bb-accent font-semibold mb-2">
            Your Personal Video Store
          </p>
          <p className="text-muted-foreground text-sm italic">
            Be Kind, Rewind.
          </p>
        </div>
      </section>
    );
  }

  const duration = formatDuration(media.durationSeconds);
  const thumbnailUrl = `/api/media/${media.id}/thumbnail`;

  return (
    <section className="relative h-[50vh] md:h-[70vh] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        {media.posterUrl !== null ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
            fetchPriority="high"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-bb-blue/40 to-background" />
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end px-6 md:px-12 pb-12 md:pb-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight">
          {media.title}
        </h1>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 flex-wrap">
          {media.year && <span>{media.year}</span>}
          {duration && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>{duration}</span>
            </>
          )}
          {media.genres.length > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>{media.genres.slice(0, 3).join(', ')}</span>
            </>
          )}
        </div>

        {/* Description */}
        {media.description && (
          <p className="text-sm md:text-base text-foreground/80 mb-6 line-clamp-2 max-w-xl">
            {media.description}
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/player/${media.id}`}
            className={cn(
              'inline-flex items-center justify-center rounded-lg px-6 h-11',
              'bg-bb-accent hover:bg-bb-accent-hover text-black font-semibold',
              'transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              'hover:shadow-[0_0_16px_rgba(255,209,0,0.5),0_0_32px_rgba(255,209,0,0.2)]',
            )}
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Play
          </Link>
          <Link
            href={`/media/${media.id}`}
            className={cn(
              'inline-flex items-center justify-center rounded-lg px-6 h-11',
              'bg-secondary/80 hover:bg-secondary text-foreground font-semibold',
              'transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              'hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]',
            )}
          >
            <Info className="w-5 h-5 mr-2" />
            More Info
          </Link>
        </div>
      </div>
    </section>
  );
}
