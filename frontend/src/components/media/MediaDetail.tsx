'use client';

import { useState } from 'react';
import { Play, Share2, Film, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EpisodeList } from '@/components/media/EpisodeList';
import { TrackList } from '@/components/media/TrackList';
import { RatingButtons } from '@/components/profile/RatingButtons';
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

interface MediaDetailProps {
  media: MediaDetail;
  onPlay?: (episodeId?: string) => void;
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

function typeLabel(type: string): string {
  switch (type) {
    case 'movie': return 'Movie';
    case 'show': return 'TV Show';
    case 'music': return 'Music';
    case 'game': return 'Game';
    default: return type;
  }
}

function extractArtistFromPath(filePath: string): string {
  // Try to extract artist name from folder structure like /music/Artist Name/Album/
  const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
  // Look for a 'music' segment and take the next one as artist
  const musicIdx = parts.findIndex((p) => p.toLowerCase() === 'music');
  if (musicIdx >= 0 && musicIdx + 1 < parts.length) {
    return parts[musicIdx + 1];
  }
  // Fallback: parent folder of the file
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return '';
}

export function MediaDetailView({ media, onPlay }: MediaDetailProps) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = `/api/media/${media.id}/thumbnail`;
  const showPoster = media.posterUrl !== null && !imgError;
  const duration = formatDuration(media.durationSeconds);
  const isShow = media.type === 'show';
  const isMusic = media.type === 'music';

  const metaParts: string[] = [];
  if (media.year) metaParts.push(String(media.year));
  if (duration) metaParts.push(duration);
  metaParts.push(typeLabel(media.type));

  // Derive artist from description or folder path for music
  const musicArtist = isMusic
    ? media.description || extractArtistFromPath(media.filePath) || 'Unknown Artist'
    : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
        {/* Backdrop image */}
        {showPoster ? (
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-bb-blue to-card flex items-center justify-center">
            {isMusic ? (
              <Music className="w-24 h-24 text-muted-foreground/30" />
            ) : (
              <Film className="w-24 h-24 text-muted-foreground/30" />
            )}
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent hidden md:block" />

        {/* Title block positioned at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 md:px-12 md:pb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 drop-shadow-lg">
            {media.title}
          </h1>

          {/* Metadata line */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            {metaParts.map((part, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground/50">|</span>}
                {part}
              </span>
            ))}
            {media.genres.length > 0 && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span>{media.genres.slice(0, 3).join(', ')}</span>
              </>
            )}
          </div>

          {/* Music artist line */}
          {isMusic && musicArtist && (
            <p className="text-muted-foreground text-sm mb-2">{musicArtist}</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {!isMusic && (
              <Button
                size="lg"
                className="bg-primary text-primary-foreground font-semibold px-6 h-10 rounded-md hover:bg-bb-accent-hover"
                onClick={() => onPlay?.()}
              >
                <Play className="w-5 h-5 mr-1 fill-current" />
                Play
              </Button>
            )}

            <RatingButtons mediaId={media.id} />

            <Button
              variant="outline"
              size="icon"
              className="border-border bg-secondary/50 hover:bg-secondary text-foreground"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content below hero */}
      <div className="px-4 md:px-12 py-6 space-y-8">
        {/* Description */}
        {media.description && (
          <p className="text-foreground text-base leading-relaxed max-w-3xl">
            {media.description}
          </p>
        )}

        {/* Genre & keyword tags */}
        {(media.genres.length > 0 || media.keywords.length > 0) && (
          <div className="space-y-3">
            {media.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-muted-foreground text-sm mr-1">Genres:</span>
                {media.genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="bg-secondary text-foreground rounded-full px-3 py-1 text-sm"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
            {media.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-muted-foreground text-sm mr-1">Keywords:</span>
                {media.keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="text-muted-foreground rounded-full px-3 py-1 text-sm"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Episode list for shows */}
        {isShow && media.episodes && media.episodes.length > 0 && (
          <>
            <div className="border-t border-border" />
            <EpisodeList
              episodes={media.episodes}
              onPlayEpisode={(episodeId) => onPlay?.(episodeId)}
            />
          </>
        )}

        {/* Track list for music */}
        {isMusic && media.episodes && media.episodes.length > 0 && (
          <>
            <div className="border-t border-border" />
            <TrackList
              albumId={media.id}
              albumTitle={media.title}
              artist={musicArtist}
              posterUrl={media.posterUrl}
              tracks={media.episodes.map((ep) => ({
                id: ep.id,
                title: ep.title,
                durationSeconds: ep.durationSeconds,
                filePath: ep.filePath,
                isEpisode: true,
              }))}
            />
          </>
        )}

        {/* Single music file (no episodes/tracks) */}
        {isMusic && (!media.episodes || media.episodes.length === 0) && (
          <>
            <div className="border-t border-border" />
            <TrackList
              albumId={media.id}
              albumTitle={media.title}
              artist={musicArtist}
              posterUrl={media.posterUrl}
              tracks={[
                {
                  id: media.id,
                  title: media.title,
                  durationSeconds: media.durationSeconds,
                  filePath: media.filePath,
                },
              ]}
            />
          </>
        )}

        {/* More Like This placeholder */}
        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-bold text-foreground mb-4">More Like This</h2>
          <p className="text-muted-foreground text-sm">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
