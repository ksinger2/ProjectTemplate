'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, MessageSquareOff } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export interface TimedComment {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  text: string;
  timestampSeconds: number;
  createdAt: string;
}

interface CommentsOverlayProps {
  comments: TimedComment[];
  currentTime: number;
}

const WINDOW_SECONDS = 2;
const DISPLAY_DURATION = 5000; // 5 seconds in ms

interface VisibleComment extends TimedComment {
  shownAt: number;
}

export function CommentsOverlay({ comments, currentTime }: CommentsOverlayProps) {
  const [visible, setVisible] = useState<VisibleComment[]>([]);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  const toggleComments = useCallback(() => {
    setCommentsEnabled((prev) => !prev);
    if (commentsEnabled) {
      setVisible([]);
    }
  }, [commentsEnabled]);

  // Find comments within the time window
  const activeComments = useMemo(() => {
    return comments.filter(
      (c) => Math.abs(c.timestampSeconds - currentTime) <= WINDOW_SECONDS,
    );
  }, [comments, currentTime]);

  // Add newly active comments and expire old ones
  useEffect(() => {
    const now = Date.now();

    setVisible((prev) => {
      // Remove expired comments
      const stillVisible = prev.filter((vc) => now - vc.shownAt < DISPLAY_DURATION);

      // Add new comments that aren't already visible
      const visibleIds = new Set(stillVisible.map((vc) => vc.id));
      const newComments = activeComments
        .filter((c) => !visibleIds.has(c.id))
        .map((c) => ({ ...c, shownAt: now }));

      if (newComments.length === 0 && stillVisible.length === prev.length) {
        return prev; // No changes
      }

      return [...stillVisible, ...newComments];
    });
  }, [activeComments]);

  // Periodic cleanup of expired comments
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setVisible((prev) => {
        const filtered = prev.filter((vc) => now - vc.shownAt < DISPLAY_DURATION);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Toggle button — top-right of overlay */}
      <button
        onClick={toggleComments}
        className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium transition-colors hover:bg-black/80"
      >
        {commentsEnabled ? (
          <>
            <MessageSquare className="size-3.5 text-bb-accent" />
            <span className="text-white/90">Comments: ON</span>
          </>
        ) : (
          <>
            <MessageSquareOff className="size-3.5 text-muted-foreground" />
            <span className="text-white/50">Comments: OFF</span>
          </>
        )}
      </button>

      {/* Comment bubbles */}
      {commentsEnabled && visible.length > 0 && (
        <div className="absolute bottom-28 left-4 right-4 z-20 pointer-events-none flex flex-col items-start gap-2">
          <AnimatePresence mode="popLayout">
            {visible.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 max-w-[80%]"
              >
                <Avatar size="sm">
                  {comment.avatarUrl ? (
                    <AvatarImage src={comment.avatarUrl} />
                  ) : (
                    <AvatarFallback>
                      {comment.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0">
                  <span className="text-bb-accent text-xs font-semibold mr-1.5">
                    {comment.displayName}
                  </span>
                  <span className="text-white text-sm">{comment.text}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
