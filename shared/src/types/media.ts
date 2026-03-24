export type MediaType = 'movie' | 'show' | 'music' | 'game';

export interface Media {
  id: string;
  title: string;
  type: MediaType;
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

export interface Episode {
  id: string;
  showId: string;
  season: number;
  episode: number;
  title: string;
  description: string | null;
  filePath: string;
  durationSeconds: number | null;
}

export interface Subtitle {
  id: string;
  mediaId: string;
  episodeId: string | null;
  language: string;
  label: string;
  filePath: string;
}

export interface MediaDetail extends Media {
  episodes?: Episode[];
  subtitles?: Subtitle[];
}
