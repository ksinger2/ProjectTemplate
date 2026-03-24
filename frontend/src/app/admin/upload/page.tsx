'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, Film, Tv, Music, Gamepad2, Image, X, CheckCircle, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type MediaType = 'movie' | 'show' | 'music' | 'game';

interface UploadFormState {
  file: File | null;
  coverArt: File | null;
  coverPreview: string | null;
  title: string;
  description: string;
  year: string;
  genres: string;
  keywords: string;
  // Show-specific
  showName: string;
  seasonNumber: string;
  // Music-specific
  artist: string;
  album: string;
  // Game-specific
  gameType: 'html5' | 'flash' | 'dos';
}

const INITIAL_FORM: UploadFormState = {
  file: null,
  coverArt: null,
  coverPreview: null,
  title: '',
  description: '',
  year: '',
  genres: '',
  keywords: '',
  showName: '',
  seasonNumber: '',
  artist: '',
  album: '',
  gameType: 'html5',
};

const TAB_ICONS: Record<MediaType, React.ReactNode> = {
  movie: <Film className="size-4" />,
  show: <Tv className="size-4" />,
  music: <Music className="size-4" />,
  game: <Gamepad2 className="size-4" />,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function AdminUploadPage() {
  const [activeTab, setActiveTab] = useState<MediaType>('movie');
  const [form, setForm] = useState<UploadFormState>(INITIAL_FORM);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ text: string; mediaId: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const updateForm = useCallback((updates: Partial<UploadFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleTabChange = (value: unknown) => {
    const tab = value as MediaType;
    setActiveTab(tab);
    setForm(INITIAL_FORM);
    setSuccessMessage(null);
    setErrorMessage('');
    setUploadProgress(null);
  };

  // File selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    updateForm({ file, title: form.title || file.name.replace(/\.[^.]+$/, '') });
  };

  // Cover art selection
  const handleCoverSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const preview = URL.createObjectURL(file);
    // Revoke previous preview URL if it exists
    if (form.coverPreview) URL.revokeObjectURL(form.coverPreview);
    updateForm({ coverArt: file, coverPreview: preview });
  };

  const removeCover = () => {
    if (form.coverPreview) URL.revokeObjectURL(form.coverPreview);
    updateForm({ coverArt: null, coverPreview: null });
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const removeFile = () => {
    updateForm({ file: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('border-bb-accent');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-bb-accent');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-bb-accent');
    handleFileSelect(e.dataTransfer.files);
  };

  // Upload
  const handleUpload = async () => {
    if (!form.file || !form.title.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');
    setSuccessMessage(null);

    try {
      // Build multipart form data
      const formData = new FormData();
      formData.append('file', form.file);
      formData.append('type', activeTab);
      formData.append('title', form.title.trim());
      if (form.description.trim()) formData.append('description', form.description.trim());
      if (form.year.trim()) formData.append('year', form.year.trim());
      if (form.genres.trim()) formData.append('genres', form.genres.trim());
      if (form.keywords.trim()) formData.append('keywords', form.keywords.trim());

      // Type-specific fields
      if (activeTab === 'show') {
        if (form.showName.trim()) formData.append('showName', form.showName.trim());
        if (form.seasonNumber.trim()) formData.append('seasonNumber', form.seasonNumber.trim());
      }
      if (activeTab === 'music') {
        if (form.artist.trim()) formData.append('artist', form.artist.trim());
        if (form.album.trim()) formData.append('album', form.album.trim());
      }
      if (activeTab === 'game') {
        formData.append('gameType', form.gameType);
      }

      // Upload with XHR for progress tracking
      const mediaId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload/media');
        xhr.withCredentials = true;

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && json.success && json.data?.id) {
              resolve(json.data.id);
            } else {
              reject(new Error(json.error || 'Upload failed'));
            }
          } catch {
            reject(new Error('Invalid server response'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.send(formData);
      });

      // Upload cover art if provided
      if (form.coverArt) {
        const posterForm = new FormData();
        posterForm.append('poster', form.coverArt);

        const posterRes = await fetch(`/api/upload/poster/${mediaId}`, {
          method: 'POST',
          credentials: 'include',
          body: posterForm,
        });

        if (!posterRes.ok) {
          // Non-critical -- media was uploaded, poster just failed
          console.warn('Poster upload failed');
        }
      }

      setSuccessMessage({ text: 'Upload successful!', mediaId });
      setForm(INITIAL_FORM);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (coverInputRef.current) coverInputRef.current.value = '';
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const canSubmit = !!form.file && form.title.trim().length > 0 && !isUploading;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Upload Media</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Admin
          </Button>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="flex items-center justify-between bg-[#46d369]/10 border border-[#46d369]/30 rounded-lg px-4 py-3 text-sm text-[#46d369]">
            <span className="flex items-center gap-2">
              <CheckCircle className="size-4" />
              {successMessage.text}
            </span>
            <div className="flex items-center gap-3">
              <a
                href={`/media/${successMessage.mediaId}`}
                className="text-bb-accent hover:underline font-medium"
              >
                View media
              </a>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center justify-between bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="movie" onValueChange={handleTabChange}>
          <TabsList className="w-full">
            {(['movie', 'show', 'music', 'game'] as MediaType[]).map((type) => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-1.5">
                {TAB_ICONS[type]}
                {type === 'movie' ? 'Movies' : type === 'show' ? 'Shows' : type === 'music' ? 'Music' : 'Games'}
              </TabsTrigger>
            ))}
          </TabsList>

          {(['movie', 'show', 'music', 'game'] as MediaType[]).map((type) => (
            <TabsContent key={type} value={type}>
              <div className="space-y-6 mt-4">
                {/* File picker */}
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-foreground">Media File</h2>

                  {form.file ? (
                    <div className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {TAB_ICONS[type]}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {form.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(form.file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeFile}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                        aria-label="Remove file"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      ref={dropZoneRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'flex flex-col items-center justify-center gap-3 py-12 px-6',
                        'border-2 border-dashed border-border rounded-lg cursor-pointer',
                        'hover:border-muted-foreground transition-colors',
                      )}
                    >
                      <Upload className="size-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          Drop files here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {type === 'movie' && 'Video files (MP4, MKV, AVI, etc.)'}
                          {type === 'show' && 'Episode video files'}
                          {type === 'music' && 'Audio files (MP3, FLAC, WAV, etc.)'}
                          {type === 'game' && 'Game files (HTML, SWF, ZIP, etc.)'}
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    accept={
                      type === 'music'
                        ? 'audio/*'
                        : type === 'game'
                          ? '.html,.htm,.swf,.zip,.exe'
                          : 'video/*'
                    }
                  />
                </div>

                {/* Upload progress */}
                {uploadProgress !== null && (
                  <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">Uploading...</span>
                      <span className="text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-bb-accent rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-foreground">Metadata</h2>

                  <div className="space-y-1.5">
                    <label htmlFor="upload-title" className="text-sm font-medium text-foreground">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="upload-title"
                      value={form.title}
                      onChange={(e) => updateForm({ title: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="Enter title"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="upload-description" className="text-sm font-medium text-foreground">
                      Description
                    </label>
                    <textarea
                      id="upload-description"
                      value={form.description}
                      onChange={(e) => updateForm({ description: e.target.value })}
                      rows={3}
                      className={cn(
                        'w-full rounded-lg border border-border bg-secondary px-3 py-2',
                        'text-sm text-foreground placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'resize-none',
                      )}
                      placeholder="Add a description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="upload-year" className="text-sm font-medium text-foreground">
                        Year
                      </label>
                      <Input
                        id="upload-year"
                        type="number"
                        value={form.year}
                        onChange={(e) => updateForm({ year: e.target.value })}
                        className="bg-secondary border-border"
                        min={1900}
                        max={2099}
                        placeholder="2024"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="upload-genres" className="text-sm font-medium text-foreground">
                        Genres
                      </label>
                      <Input
                        id="upload-genres"
                        value={form.genres}
                        onChange={(e) => updateForm({ genres: e.target.value })}
                        className="bg-secondary border-border"
                        placeholder="action, sci-fi, drama"
                      />
                      <p className="text-xs text-muted-foreground">Comma-separated</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="upload-keywords" className="text-sm font-medium text-foreground">
                      Keywords
                    </label>
                    <Input
                      id="upload-keywords"
                      value={form.keywords}
                      onChange={(e) => updateForm({ keywords: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="desert, space, rebellion"
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated</p>
                  </div>

                  {/* Show-specific fields */}
                  {type === 'show' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div className="space-y-1.5">
                        <label htmlFor="upload-show-name" className="text-sm font-medium text-foreground">
                          Show Name
                        </label>
                        <Input
                          id="upload-show-name"
                          value={form.showName}
                          onChange={(e) => updateForm({ showName: e.target.value })}
                          className="bg-secondary border-border"
                          placeholder="Show title"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="upload-season" className="text-sm font-medium text-foreground">
                          Season Number
                        </label>
                        <Input
                          id="upload-season"
                          type="number"
                          value={form.seasonNumber}
                          onChange={(e) => updateForm({ seasonNumber: e.target.value })}
                          className="bg-secondary border-border"
                          min={1}
                          placeholder="1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Music-specific fields */}
                  {type === 'music' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div className="space-y-1.5">
                        <label htmlFor="upload-artist" className="text-sm font-medium text-foreground">
                          Artist
                        </label>
                        <Input
                          id="upload-artist"
                          value={form.artist}
                          onChange={(e) => updateForm({ artist: e.target.value })}
                          className="bg-secondary border-border"
                          placeholder="Artist name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="upload-album" className="text-sm font-medium text-foreground">
                          Album
                        </label>
                        <Input
                          id="upload-album"
                          value={form.album}
                          onChange={(e) => updateForm({ album: e.target.value })}
                          className="bg-secondary border-border"
                          placeholder="Album name"
                        />
                      </div>
                    </div>
                  )}

                  {/* Game-specific fields */}
                  {type === 'game' && (
                    <div className="pt-2 border-t border-border">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Game Type</label>
                        <div className="flex gap-2">
                          {(['html5', 'flash', 'dos'] as const).map((gt) => (
                            <button
                              key={gt}
                              onClick={() => updateForm({ gameType: gt })}
                              className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                form.gameType === gt
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-foreground hover:bg-secondary/80',
                              )}
                            >
                              {gt === 'html5' ? 'HTML5' : gt === 'flash' ? 'Flash' : 'DOS'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cover art */}
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-foreground">Cover Art</h2>

                  <div className="flex items-start gap-4">
                    {form.coverPreview ? (
                      <div className="relative group">
                        <img
                          src={form.coverPreview}
                          alt="Cover preview"
                          className="w-32 h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={removeCover}
                          className="absolute top-1 right-1 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove cover art"
                        >
                          <X className="size-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        className={cn(
                          'flex flex-col items-center justify-center gap-2 w-32 h-48',
                          'border-2 border-dashed border-border rounded-lg cursor-pointer',
                          'hover:border-muted-foreground transition-colors',
                        )}
                      >
                        <Image className="size-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground text-center">
                          Add cover
                        </span>
                      </button>
                    )}

                    <p className="text-xs text-muted-foreground pt-1">
                      Optional. Recommended size: 300x450px. JPG, PNG, or WebP.
                    </p>
                  </div>

                  <input
                    ref={coverInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleCoverSelect(e.target.files)}
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleUpload}
                  disabled={!canSubmit}
                  className="w-full bg-bb-accent text-black hover:bg-bb-accent/90 font-semibold h-12"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="size-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}
