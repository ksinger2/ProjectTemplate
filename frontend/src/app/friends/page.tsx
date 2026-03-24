'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Send, UserPlus, UserCheck, UserX, Clock, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

interface FriendEntry {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';
  createdAt: string;
  friend: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    createdAt: string;
  } | null;
}

export default function FriendsPage() {
  const [friendEmail, setFriendEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<FriendEntry[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<FriendEntry[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    try {
      const res = await fetch('/api/friends', { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success) return;

      const data = json.data as { friends: FriendEntry[]; pending: FriendEntry[] };
      setFriends(data.friends);
      setPendingIncoming(
        data.pending.filter((p) => p.status === 'pending_received'),
      );
      setPendingOutgoing(
        data.pending.filter((p) => p.status === 'pending_sent'),
      );
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleSendRequest = async () => {
    setError('');
    setSuccess('');

    if (!friendEmail.trim()) {
      setError('Please enter an email address.');
      return;
    }

    if (!isValidEmail(friendEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSending(true);
    try {
      await api.friends.add(friendEmail.trim());
      setSuccess(`Request sent to ${friendEmail}!`);
      setFriendEmail('');
      loadFriends();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send request';
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await api.friends.accept(id);
      loadFriends();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.friends.reject(id);
      loadFriends();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.friends.remove(id);
      loadFriends();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendRequest();
    }
  };

  const hasPending = pendingIncoming.length > 0 || pendingOutgoing.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-foreground">Friends</h1>

        {/* Add friend */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Add Friend
          </h2>
          <div className="flex gap-2">
            <Input
              type="email"
              value={friendEmail}
              onChange={(e) => {
                setFriendEmail(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter email address"
              className="bg-card border-border flex-1"
              aria-label="Friend email address"
              disabled={isSending}
            />
            <Button onClick={handleSendRequest} disabled={isSending}>
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-400" role="status">
              {success}
            </p>
          )}
        </div>

        <Separator className="bg-border" />

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 text-muted-foreground animate-spin" />
          </div>
        )}

        {/* Pending requests */}
        {!isLoading && hasPending && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">
              Pending Requests
            </h2>

            {/* Incoming */}
            {pendingIncoming.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Incoming
                </p>
                {pendingIncoming.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 bg-[#132743] rounded-lg p-3"
                  >
                    <Avatar size="default">
                      {req.friend?.avatarUrl ? (
                        <AvatarImage src={req.friend.avatarUrl} />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(req.friend?.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {req.friend?.displayName || req.friend?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {req.friend?.email}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(req.id)}
                        disabled={actionLoading === req.id}
                        className="h-8"
                      >
                        {actionLoading === req.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <UserCheck className="size-3.5" />
                        )}
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(req.id)}
                        disabled={actionLoading === req.id}
                        className="h-8"
                      >
                        <UserX className="size-3.5" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Outgoing */}
            {pendingOutgoing.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Sent
                </p>
                {pendingOutgoing.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 bg-[#132743] rounded-lg p-3"
                  >
                    <Avatar size="default">
                      {req.friend?.avatarUrl ? (
                        <AvatarImage src={req.friend.avatarUrl} />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(req.friend?.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {req.friend?.displayName || req.friend?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        Pending
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(req.id)}
                      disabled={actionLoading === req.id}
                      className="h-8 text-muted-foreground hover:text-destructive"
                    >
                      {actionLoading === req.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <X className="size-3.5" />
                      )}
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator className="bg-border" />
          </div>
        )}

        {/* Friends list */}
        {!isLoading && friends.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              Your Friends ({friends.length})
            </h2>
            <div className="space-y-2">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 bg-[#132743] rounded-lg p-3 group"
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
                    {/* Online indicator */}
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#46d369] border-2 border-[#132743]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {f.friend?.displayName || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {f.friend?.email}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(f.id)}
                    disabled={actionLoading === f.id}
                    className="h-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    {actionLoading === f.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <X className="size-3.5" />
                    )}
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && friends.length === 0 && !hasPending && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="size-8 text-muted-foreground/50" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-1">
              No friends yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Add friends by email to share the experience. Watch together,
              send recommendations, and more.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() =>
                document
                  .querySelector<HTMLInputElement>('input[type="email"]')
                  ?.focus()
              }
            >
              <UserPlus className="size-4" />
              Add your first friend
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
