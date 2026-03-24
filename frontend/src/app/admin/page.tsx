'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Film, Tv, Music, Gamepad2, Pencil, Loader2, RefreshCw, X, List, Upload,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

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

const FILTERS: { label: string; value: MediaType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Movies', value: 'movie' },
  { label: 'Shows', value: 'show' },
  { label: 'Music', value: 'music' },
  { label: 'Games', value: 'game' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  movie: <Film className="size-3.5" />,
  show: <Tv className="size-3.5" />,
  music: <Music className="size-3.5" />,
  game: <Gamepad2 className="size-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  movie: 'Movie',
  show: 'Show',
  music: 'Music',
  game: 'Game',
};

interface EditFormData {
  title: string;
  description: string;
  year: string;
  genres: string;
  keywords: string;
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
          <Skeleton className="w-[60px] h-[40px] rounded" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MediaType>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editForm, setEditForm] = useState<EditFormData>({
    title: '',
    description: '',
    year: '',
    genres: '',
    keywords: '',
  });

  // Episode intro management
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const [episodesMedia, setEpisodesMedia] = useState<Media | null>(null);
  const [episodesList, setEpisodesList] = useState<
    { id: string; seasonNumber: number; episodeNumber: number; title: string; introStart: number | null; introEnd: number | null }[]
  >([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodeSaving, setEpisodeSaving] = useState<string | null>(null);
  const [episodeSaveMsg, setEpisodeSaveMsg] = useState<Record<string, string>>({});

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMedia(json.data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleScan = async () => {
    setIsScanning(true);
    setScanMessage('');
    try {
      const res = await fetch('/api/media/scan', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        const { added, updated, removed } = json.data;
        setScanMessage(
          `Scan complete. ${added} added, ${updated} updated, ${removed} removed.`
        );
        fetchMedia();
      } else {
        setScanMessage('Scan completed.');
        fetchMedia();
      }
    } catch {
      setScanMessage('Scan failed. Check server logs.');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(''), 5000);
    }
  };

  const openEdit = (item: Media) => {
    setEditingMedia(item);
    setSaveError('');
    setEditForm({
      title: item.title,
      description: item.description || '',
      year: item.year?.toString() || '',
      genres: item.genres.join(', '),
      keywords: item.keywords.join(', '),
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editingMedia) return;
    setIsSaving(true);
    setSaveError('');

    const payload: Record<string, unknown> = {
      title: editForm.title,
      description: editForm.description || null,
      year: editForm.year ? parseInt(editForm.year, 10) : null,
      genres: editForm.genres
        ? editForm.genres.split(',').map((g) => g.trim()).filter(Boolean)
        : [],
      keywords: editForm.keywords
        ? editForm.keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [],
    };

    try {
      const res = await fetch(`/api/admin/media/${editingMedia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMedia((prev) =>
          prev.map((m) => (m.id === editingMedia.id ? json.data : m))
        );
        setEditOpen(false);
        setEditingMedia(null);
      } else {
        setSaveError(json.error || 'Failed to save changes. Please try again.');
      }
    } catch {
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const openEpisodes = async (item: Media) => {
    setEpisodesMedia(item);
    setEpisodesOpen(true);
    setEpisodesLoading(true);
    setEpisodeSaveMsg({});
    try {
      const res = await fetch(`/api/media/${item.id}/episodes`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEpisodesList(
          json.data.map((ep: Record<string, unknown>) => ({
            id: ep.id as string,
            seasonNumber: ep.seasonNumber as number ?? ep.season as number ?? 1,
            episodeNumber: ep.episodeNumber as number ?? ep.episode as number ?? 1,
            title: ep.title as string ?? '',
            introStart: (ep.introStart as number) ?? null,
            introEnd: (ep.introEnd as number) ?? null,
          }))
        );
      }
    } catch {
      setEpisodesList([]);
    } finally {
      setEpisodesLoading(false);
    }
  };

  const handleEpisodeIntroSave = async (epId: string, introStart: number | null, introEnd: number | null) => {
    setEpisodeSaving(epId);
    setEpisodeSaveMsg((prev) => ({ ...prev, [epId]: '' }));
    try {
      const res = await fetch(`/api/admin/episodes/${epId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ introStart, introEnd }),
      });
      const json = await res.json();
      if (json.success) {
        setEpisodeSaveMsg((prev) => ({ ...prev, [epId]: 'Saved' }));
      } else {
        setEpisodeSaveMsg((prev) => ({ ...prev, [epId]: json.error || 'Failed' }));
      }
    } catch {
      setEpisodeSaveMsg((prev) => ({ ...prev, [epId]: 'Failed' }));
    } finally {
      setEpisodeSaving(null);
      setTimeout(() => {
        setEpisodeSaveMsg((prev) => ({ ...prev, [epId]: '' }));
      }, 3000);
    }
  };

  const filteredMedia = media.filter((m) => {
    const matchesFilter = activeFilter === 'all' || m.type === activeFilter;
    const matchesSearch =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Admin: Media Library</h1>
          <div className="flex items-center gap-2">
            <Link href="/admin/upload">
              <Button variant="outline" className="w-fit">
                <Upload className="size-4" />
                Upload Media
              </Button>
            </Link>
            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="w-fit"
            >
              {isScanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {isScanning ? 'Scanning...' : 'Scan Library'}
            </Button>
          </div>
        </div>

        {/* Scan message */}
        {scanMessage && (
          <div className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground">
            <span>{scanMessage}</span>
            <button
              onClick={() => setScanMessage('')}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media..."
            className="pl-9 bg-card border-border"
            aria-label="Filter media list"
          />
        </div>

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
              {f.label}
            </button>
          ))}
        </div>

        {/* Media list */}
        {isLoading ? (
          <SkeletonRows />
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Film className="size-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground">
              {media.length === 0
                ? 'No media found. Add files to /media and scan.'
                : 'No media matches your search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg transition-colors',
                  'hover:bg-secondary cursor-default',
                )}
              >
                {/* Thumbnail */}
                <div className="w-[60px] h-[40px] rounded bg-secondary flex-shrink-0 overflow-hidden">
                  {item.posterUrl ? (
                    <img
                      src={`/api/media/${item.id}/thumbnail`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                      {TYPE_ICONS[item.type] || <Film className="size-4" />}
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  {item.genres.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.genres.join(', ')}
                    </p>
                  )}
                </div>

                {/* Type badge */}
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {TYPE_LABELS[item.type] || item.type}
                </Badge>

                {/* Year */}
                <span className="text-sm text-muted-foreground hidden sm:block w-12 text-right">
                  {item.year || '---'}
                </span>

                {/* Episodes button (shows only) */}
                {item.type === 'show' && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEpisodes(item)}
                    aria-label={`Episodes for ${item.title}`}
                  >
                    <List className="size-3.5" />
                  </Button>
                )}

                {/* Edit button */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(item)}
                  aria-label={`Edit ${item.title}`}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Episodes intro dialog */}
      <Dialog open={episodesOpen} onOpenChange={setEpisodesOpen}>
        <DialogContent className="sm:max-w-2xl bg-card max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Episodes: {episodesMedia?.title}</DialogTitle>
          </DialogHeader>

          {episodesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : episodesList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No episodes found for this show.
            </p>
          ) : (
            <div className="space-y-2">
              {episodesList
                .sort((a, b) =>
                  a.seasonNumber !== b.seasonNumber
                    ? a.seasonNumber - b.seasonNumber
                    : a.episodeNumber - b.episodeNumber
                )
                .map((ep) => (
                  <div
                    key={ep.id}
                    className="flex flex-wrap items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">
                      S{String(ep.seasonNumber).padStart(2, '0')}E{String(ep.episodeNumber).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
                      {ep.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Start</label>
                      <Input
                        type="number"
                        min={0}
                        value={ep.introStart ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          setEpisodesList((prev) =>
                            prev.map((x) => (x.id === ep.id ? { ...x, introStart: val } : x))
                          );
                        }}
                        className="w-20 h-8 text-xs bg-secondary border-border"
                        placeholder="sec"
                      />
                      <label className="text-xs text-muted-foreground">End</label>
                      <Input
                        type="number"
                        min={0}
                        value={ep.introEnd ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          setEpisodesList((prev) =>
                            prev.map((x) => (x.id === ep.id ? { ...x, introEnd: val } : x))
                          );
                        }}
                        className="w-20 h-8 text-xs bg-secondary border-border"
                        placeholder="sec"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={episodeSaving === ep.id}
                        onClick={() => handleEpisodeIntroSave(ep.id, ep.introStart, ep.introEnd)}
                        className="h-8 text-xs"
                      >
                        {episodeSaving === ep.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                      {episodeSaveMsg[ep.id] && (
                        <span
                          className={cn(
                            'text-xs',
                            episodeSaveMsg[ep.id] === 'Saved' ? 'text-[#46d369]' : 'text-destructive',
                          )}
                        >
                          {episodeSaveMsg[ep.id]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="edit-title" className="text-sm font-medium text-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className={cn(
                  'w-full rounded-lg border border-border bg-secondary px-3 py-2',
                  'text-sm text-foreground placeholder:text-muted-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'resize-none',
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-year" className="text-sm font-medium text-foreground">
                Year
              </label>
              <Input
                id="edit-year"
                type="number"
                value={editForm.year}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, year: e.target.value }))
                }
                className="bg-secondary border-border w-32"
                min={1900}
                max={2099}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-genres" className="text-sm font-medium text-foreground">
                Genres
              </label>
              <Input
                id="edit-genres"
                value={editForm.genres}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, genres: e.target.value }))
                }
                placeholder="action, sci-fi, drama"
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">Comma-separated</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-keywords" className="text-sm font-medium text-foreground">
                Keywords
              </label>
              <Input
                id="edit-keywords"
                value={editForm.keywords}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, keywords: e.target.value }))
                }
                placeholder="desert, space, rebellion"
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">Comma-separated</p>
            </div>
          </div>

          <DialogFooter className="flex-col items-stretch gap-2">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !editForm.title.trim()}
              >
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </div>
            {saveError && (
              <p className="text-sm text-destructive text-right" role="alert">
                {saveError}
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
