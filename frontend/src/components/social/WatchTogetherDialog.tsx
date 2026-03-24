'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';

interface FriendEntry {
  id: string;
  userId: string;
  friendId: string;
  status: string;
  friend: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
}

interface WatchTogetherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: string;
  mediaTitle: string;
  episodeId?: string;
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

export function WatchTogetherDialog({
  open,
  onOpenChange,
  mediaId,
  mediaTitle,
  episodeId,
}: WatchTogetherDialogProps) {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadFriends = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/friends', { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setFriends(json.data.friends || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadFriends();
      setSelectedFriend(null);
    }
  }, [open, loadFriends]);

  const handleStart = async () => {
    if (!selectedFriend) return;

    const friendEntry = friends.find((f) => f.id === selectedFriend);
    const friendUserId = friendEntry?.friend?.id;
    if (!friendUserId) return;

    setIsCreating(true);
    try {
      // Create session via REST API
      const res = await api.sessions.create(mediaId, episodeId);
      // Backend returns { sessionId } but TS type has { id }
      const resData = res.data as unknown as Record<string, string>;
      const sessionId = resData?.sessionId ?? resData?.id;

      if (sessionId) {
        // Invite the friend
        try {
          await api.sessions.invite(sessionId, friendUserId);
        } catch {
          // invitation failed but session is created, proceed anyway
        }

        // Navigate to player with session param
        const epParam = episodeId ? `&episode=${episodeId}` : '';
        router.push(`/player/${mediaId}?session=${sessionId}${epParam}`);
        onOpenChange(false);
      }
    } catch {
      // ignore
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#132743] border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Watch Together</DialogTitle>
          <DialogDescription>
            Invite a friend to watch &quot;{mediaTitle}&quot; in sync
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-6 text-muted-foreground animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No friends to watch with yet. Add friends first.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {friends.map((f) => {
                const isSelected = selectedFriend === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      setSelectedFriend(isSelected ? null : f.id)
                    }
                    className={`flex items-center gap-3 w-full rounded-lg p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/20 ring-1 ring-primary'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="relative">
                      <Avatar size="default">
                        {f.friend?.avatarUrl ? (
                          <AvatarImage src={f.friend.avatarUrl} />
                        ) : null}
                        <AvatarFallback>
                          {getInitials(f.friend?.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#46d369] border-2 border-[#132743]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {f.friend?.displayName || 'Unknown'}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="size-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <Button
            onClick={handleStart}
            disabled={!selectedFriend || isCreating}
            className="w-full"
          >
            {isCreating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Users className="size-4" />
            )}
            Start Watch Party
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
