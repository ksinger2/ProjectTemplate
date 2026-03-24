'use client';

import { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RatingButtonsProps {
  mediaId: string;
}

type RatingValue = 1 | -1 | 0;

export function RatingButtons({ mediaId }: RatingButtonsProps) {
  const [rating, setRating] = useState<RatingValue>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current rating on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchRating() {
      try {
        const res = await fetch(`/api/ratings/${mediaId}`, { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.success) {
          setRating(json.data.rating as RatingValue);
        }
      } catch {
        // Silently fail - default to no rating
      }
    }

    fetchRating();
    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  const submitRating = useCallback(
    async (newRating: 'up' | 'down' | null) => {
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ mediaId, rating: newRating }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setRating(json.data.rating as RatingValue);
          }
        }
      } catch {
        // Silently fail
      } finally {
        setIsSubmitting(false);
      }
    },
    [mediaId],
  );

  const handleThumbsUp = () => {
    if (isSubmitting) return;
    submitRating(rating === 1 ? null : 'up');
  };

  const handleThumbsDown = () => {
    if (isSubmitting) return;
    submitRating(rating === -1 ? null : 'down');
  };

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'w-10 h-10 rounded-full border-border bg-secondary/50 hover:bg-secondary',
                rating === 1
                  ? 'text-white fill-current border-white/50'
                  : 'text-foreground',
              )}
              aria-label="Like"
              aria-pressed={rating === 1}
              onClick={handleThumbsUp}
              disabled={isSubmitting}
            />
          }
        >
          <ThumbsUp className={cn('w-4 h-4', rating === 1 && 'fill-current')} />
        </TooltipTrigger>
        <TooltipContent>Like</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'w-10 h-10 rounded-full border-border bg-secondary/50 hover:bg-secondary',
                rating === -1
                  ? 'text-white fill-current border-white/50'
                  : 'text-foreground',
              )}
              aria-label="Dislike"
              aria-pressed={rating === -1}
              onClick={handleThumbsDown}
              disabled={isSubmitting}
            />
          }
        >
          <ThumbsDown className={cn('w-4 h-4', rating === -1 && 'fill-current')} />
        </TooltipTrigger>
        <TooltipContent>Dislike</TooltipContent>
      </Tooltip>
    </div>
  );
}
