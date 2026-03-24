'use client';

import { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { TimedComment } from './CommentsOverlay';

function formatTimestamp(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface CommentInputProps {
  mediaId: string;
  episodeId?: string;
  currentTime: number;
  onCommentAdded: (comment: TimedComment) => void;
}

export function CommentInput({
  mediaId,
  episodeId,
  currentTime,
  onCommentAdded,
}: CommentInputProps) {
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || isPosting) return;

    setIsPosting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId,
          episodeId: episodeId || undefined,
          timestampSeconds: Math.floor(currentTime),
          text: text.trim(),
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        onCommentAdded(json.data);
        setText('');
      }
    } catch {
      // Silently fail -- comment just won't appear
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Stop propagation so player keyboard shortcuts don't fire
    e.stopPropagation();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="size-4" />
        Add a timed comment
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
      <span className="text-xs font-mono text-bb-accent whitespace-nowrap">
        {formatTimestamp(currentTime)}
      </span>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment at this moment..."
        className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm h-8 px-2"
        autoFocus
        disabled={isPosting}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => { setIsOpen(false); setText(''); }}
        className="text-muted-foreground hover:text-foreground h-8 px-2"
      >
        Cancel
      </Button>
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!text.trim() || isPosting}
        className="bg-bb-accent text-black hover:bg-bb-accent/90 h-8 px-3"
      >
        <Send className="size-3.5" />
        Post
      </Button>
    </div>
  );
}
