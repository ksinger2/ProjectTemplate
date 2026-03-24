'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Bell, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface InboxItem {
  id: string;
  fromUserId: string;
  toUserId: string;
  mediaId: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  fromUser: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  media: {
    id: string;
    title: string;
    type: string;
    posterUrl: string | null;
  } | null;
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function RecommendationsInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((i) => !i.isRead).length;

  const loadInbox = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/recommendations/inbox', {
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll every 30s for new recommendations
  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 30000);
    return () => clearInterval(interval);
  }, [loadInbox]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadInbox();
        }}
        className={cn(
          'inline-flex items-center justify-center size-11 rounded-lg relative',
          'text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        aria-label={`Recommendations${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#132743] border border-border rounded-lg shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Recommendations
            </h3>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 text-muted-foreground animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No recommendations yet
                </p>
              </div>
            ) : (
              items.slice(0, 10).map((item) => (
                <Link
                  key={item.id}
                  href={`/media/${item.mediaId}`}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors',
                    !item.isRead && 'bg-primary/5',
                  )}
                >
                  {/* Sender avatar */}
                  <Avatar size="sm">
                    {item.fromUser?.avatarUrl ? (
                      <AvatarImage src={item.fromUser.avatarUrl} />
                    ) : null}
                    <AvatarFallback>
                      {getInitials(item.fromUser?.displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-medium">
                        {item.fromUser?.displayName || 'Someone'}
                      </span>
                      {' recommended '}
                      <span className="font-medium">
                        {item.media?.title || 'a title'}
                      </span>
                    </p>
                    {item.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        &quot;{item.message}&quot;
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>

                  {/* Media poster thumbnail */}
                  {item.media?.posterUrl && (
                    <img
                      src={`/api/media/${item.mediaId}/thumbnail`}
                      alt=""
                      className="size-10 rounded object-cover shrink-0"
                    />
                  )}

                  {/* Unread dot */}
                  {!item.isRead && (
                    <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
