'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Maximize, Minimize, Loader2, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type GameType = 'html' | 'flash' | 'dos';

function gameTypeLabel(gameType: GameType): string {
  switch (gameType) {
    case 'flash': return 'Flash Game';
    case 'dos': return 'DOS Game';
    case 'html': return 'HTML5 Game';
    default: return 'Game';
  }
}

function gameTypeBadgeClasses(gameType: GameType): string {
  switch (gameType) {
    case 'flash': return 'bg-amber-500/20 text-amber-400';
    case 'dos': return 'bg-green-500/20 text-green-400';
    case 'html': return 'bg-blue-500/20 text-blue-400';
    default: return 'bg-blue-500/20 text-blue-400';
  }
}

export default function GamePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState<string>('');
  const [gameType, setGameType] = useState<GameType>('html');

  // Fetch media details to get game title
  useEffect(() => {
    if (!id) return;

    async function fetchGame() {
      try {
        const res = await fetch(`/api/media/${id}`, { credentials: 'include' });
        if (!res.ok) {
          setError(res.status === 404 ? 'Game not found.' : 'Failed to load game.');
          return;
        }
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.type !== 'game') {
            setError('This media is not a game.');
            return;
          }
          setGameTitle(json.data.title);
          if (json.data.gameType) {
            setGameType(json.data.gameType);
          }
        } else {
          setError('Failed to load game details.');
        }
      } catch {
        setError('Unable to connect to the server.');
      }
    }

    fetchGame();
  }, [id]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        // Fullscreen not supported or denied
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  }, []);

  // Listen for fullscreen changes (e.g., Escape key exits fullscreen)
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Listen for Escape to go back when not fullscreen
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        router.push(`/media/${id}`);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, id]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load the game.');
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Gamepad2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Cannot Load Game</h1>
        <p className="text-muted-foreground mb-6 text-center">{error}</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/media/${id}`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </Button>
      </main>
    );
  }

  // Game content URL served by the backend
  const gameUrl = `/api/media/${id}/game`;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-bb-background/90 backdrop-blur-sm border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/media/${id}`)}
            className="text-muted-foreground hover:text-foreground gap-1.5"
            aria-label="Back to media detail"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          {gameTitle && (
            <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
              {gameTitle}
            </h1>
          )}

          <Badge className={gameTypeBadgeClasses(gameType)}>
            {gameTypeLabel(gameType)}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="text-muted-foreground hover:text-foreground"
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* DOS keyboard capture note */}
      {gameType === 'dos' && (
        <div className="px-4 py-1.5 bg-green-500/10 text-green-400 text-xs text-center shrink-0">
          Click the game area to capture keyboard input. Press Escape to release.
        </div>
      )}

      {/* Game iframe container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-foreground animate-spin" />
              <p className="text-muted-foreground text-sm">Loading game...</p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={gameUrl}
          title={gameTitle || 'Game'}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="autoplay; fullscreen"
        />
      </div>
    </div>
  );
}
