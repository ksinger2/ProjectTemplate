'use client';

import { Play, Pause, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useMusicPlayer,
  type MusicTrack,
} from '@/providers/MusicPlayerProvider';
import { cn } from '@/lib/utils';

interface Track {
  id: string;
  title: string;
  durationSeconds: number | null;
  filePath: string;
  /** Whether this track is an episode (uses episode stream endpoint) */
  isEpisode?: boolean;
}

interface TrackListProps {
  albumId: string;
  albumTitle: string;
  artist: string;
  posterUrl: string | null;
  tracks: Track[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function toMusicTrack(
  track: Track,
  albumId: string,
  albumTitle: string,
  artist: string,
  posterUrl: string | null
): MusicTrack {
  return {
    id: track.id,
    title: track.title,
    artist,
    posterUrl,
    durationSeconds: track.durationSeconds,
    albumId,
    albumTitle,
    isEpisode: track.isEpisode,
  };
}

export function TrackList({
  albumId,
  albumTitle,
  artist,
  posterUrl,
  tracks,
}: TrackListProps) {
  const { currentTrack, isPlaying, play, pause, resume } = useMusicPlayer();

  const musicTracks = tracks.map((t) =>
    toMusicTrack(t, albumId, albumTitle, artist, posterUrl)
  );

  const handlePlayAll = () => {
    if (musicTracks.length > 0) {
      play(musicTracks[0], musicTracks);
    }
  };

  const handleTrackClick = (track: MusicTrack) => {
    if (currentTrack?.id === track.id) {
      // Toggle play/pause for the current track
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      // Play this track with the album as the playlist
      play(track, musicTracks);
    }
  };

  if (tracks.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No tracks found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Tracks</h2>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground font-semibold px-4 hover:bg-bb-accent-hover"
          onClick={handlePlayAll}
        >
          <Play className="w-4 h-4 mr-1 fill-current" />
          Play All
        </Button>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {musicTracks.map((track, index) => {
          const isCurrentTrack = currentTrack?.id === track.id;
          const isThisPlaying = isCurrentTrack && isPlaying;

          return (
            <button
              key={track.id}
              type="button"
              onClick={() => handleTrackClick(track)}
              className={cn(
                'group/track flex items-center gap-4 py-3 px-3 text-left w-full',
                'rounded-md transition-colors duration-150',
                'hover:bg-secondary focus-visible:bg-secondary',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                isCurrentTrack && 'bg-secondary/50'
              )}
            >
              {/* Track number / play icon */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {isThisPlaying ? (
                  <Pause className="w-4 h-4 text-bb-accent fill-bb-accent" />
                ) : isCurrentTrack ? (
                  <Play className="w-4 h-4 text-bb-accent fill-bb-accent" />
                ) : (
                  <>
                    <span className="text-muted-foreground text-sm font-medium group-hover/track:hidden group-focus-visible/track:hidden">
                      {index + 1}
                    </span>
                    <Play className="w-4 h-4 text-foreground hidden group-hover/track:block group-focus-visible/track:block" />
                  </>
                )}
              </div>

              {/* Track title */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-medium text-sm truncate',
                    isCurrentTrack ? 'text-bb-accent' : 'text-foreground'
                  )}
                >
                  {track.title}
                </p>
              </div>

              {/* Duration */}
              {track.durationSeconds && (
                <span className="flex-shrink-0 text-muted-foreground text-sm tabular-nums">
                  {formatDuration(track.durationSeconds)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
