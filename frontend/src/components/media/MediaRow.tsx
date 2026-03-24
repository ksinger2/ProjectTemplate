'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaCard } from './MediaCard';
import { MediaCardSkeleton } from './MediaCardSkeleton';

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

interface MediaRowProps {
  title: string;
  items: Media[];
  isLoading?: boolean;
}

export function MediaRow({ title, items, isLoading = false }: MediaRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, items]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth - 180;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  // Don't render empty rows (unless loading)
  if (!isLoading && items.length === 0) return null;

  return (
    <section
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label={title}
    >
      {/* Title */}
      {isLoading ? (
        <div className="h-7 w-40 rounded bg-card animate-pulse mb-3" />
      ) : (
        <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      )}

      {/* Scroll container */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full bg-secondary/90 backdrop-blur-sm',
              'flex items-center justify-center',
              'text-white hover:bg-secondary transition-all duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              'opacity-0 pointer-events-none',
              isHovered && 'opacity-100 pointer-events-auto',
              // Always hide on touch devices
              'max-md:hidden',
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Cards */}
        <div
          ref={scrollRef}
          className={cn(
            'flex gap-2 overflow-x-auto scrollbar-none',
            'snap-x snap-mandatory scroll-smooth',
            'pb-1', // space for focus outline
          )}
          style={{ scrollbarWidth: 'none' }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <MediaCardSkeleton key={i} />
              ))
            : items.map((media) => (
                <div key={media.id} className="snap-start">
                  <MediaCard media={media} />
                </div>
              ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full bg-secondary/90 backdrop-blur-sm',
              'flex items-center justify-center',
              'text-white hover:bg-secondary transition-all duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              'opacity-0 pointer-events-none',
              isHovered && 'opacity-100 pointer-events-auto',
              'max-md:hidden',
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
}
