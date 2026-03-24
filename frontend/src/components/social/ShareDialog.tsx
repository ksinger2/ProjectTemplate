'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: string;
  mediaTitle: string;
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

export function ShareDialog({
  open,
  onOpenChange,
  mediaId,
  mediaTitle,
}: ShareDialogProps) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

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
      setMessage('');
      setSent(false);
    }
  }, [open, loadFriends]);

  const handleShare = async () => {
    if (!selectedFriend) return;

    // Find the friend's user id (the other user's id, not the friendship id)
    const friendEntry = friends.find((f) => f.id === selectedFriend);
    const toUserId = friendEntry?.friend?.id;
    if (!toUserId) return;

    setIsSending(true);
    try {
      await api.recommendations.share(mediaId, toUserId, message || undefined);
      setSent(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch {
      // ignore
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#132743] border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Share</DialogTitle>
          <DialogDescription>
            Recommend &quot;{mediaTitle}&quot; to a friend
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="size-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="size-6 text-green-400" />
            </div>
            <p className="text-sm text-foreground font-medium">Sent!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Friend list */}
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-6 text-muted-foreground animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No friends to share with yet. Add friends first.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {friends.map((f) => {
                  const isSelected = selectedFriend === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFriend(isSelected ? null : f.id)}
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

            {/* Message input */}
            {selectedFriend && (
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message (optional)"
                className="bg-background/50 border-border"
                maxLength={280}
              />
            )}

            {/* Send button */}
            <Button
              onClick={handleShare}
              disabled={!selectedFriend || isSending}
              className="w-full"
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send Recommendation
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
