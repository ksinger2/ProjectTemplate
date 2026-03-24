'use client';

import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

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

interface EpisodeListProps {
  episodes: Episode[];
  onPlayEpisode?: (episodeId: string) => void;
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

export function EpisodeList({ episodes, onPlayEpisode }: EpisodeListProps) {
  const seasonMap = useMemo(() => {
    const map = new Map<number, Episode[]>();
    for (const ep of episodes) {
      const existing = map.get(ep.season) || [];
      existing.push(ep);
      map.set(ep.season, existing);
    }
    // Sort episodes within each season
    for (const [, eps] of map) {
      eps.sort((a, b) => a.episode - b.episode);
    }
    return map;
  }, [episodes]);

  const seasons = useMemo(
    () => Array.from(seasonMap.keys()).sort((a, b) => a - b),
    [seasonMap]
  );

  if (episodes.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No episodes found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-foreground mb-4">Episodes</h2>

      <Tabs defaultValue={seasons[0]}>
        <TabsList variant="line" className="mb-4">
          {seasons.map((season) => (
            <TabsTrigger key={season} value={season}>
              Season {season}
            </TabsTrigger>
          ))}
        </TabsList>

        {seasons.map((season) => (
          <TabsContent key={season} value={season}>
            <div className="flex flex-col divide-y divide-border">
              {(seasonMap.get(season) || []).map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => onPlayEpisode?.(ep.id)}
                  className={cn(
                    'group/episode flex items-start gap-4 py-4 px-3 text-left w-full',
                    'rounded-md transition-colors duration-150',
                    'hover:bg-secondary focus-visible:bg-secondary',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                  )}
                >
                  {/* Episode number with play icon on hover */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    <span className="text-muted-foreground text-lg font-medium group-hover/episode:hidden group-focus-visible/episode:hidden">
                      {ep.episode}
                    </span>
                    <Play className="w-5 h-5 text-foreground hidden group-hover/episode:block group-focus-visible/episode:block" />
                  </div>

                  {/* Episode info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-sm truncate">
                      {ep.title}
                    </p>
                    {ep.description && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {ep.description}
                      </p>
                    )}
                  </div>

                  {/* Duration */}
                  {ep.durationSeconds && (
                    <span className="flex-shrink-0 text-muted-foreground text-sm">
                      {formatDuration(ep.durationSeconds)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
