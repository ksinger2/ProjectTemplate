'use client';

import { LogOut, Wifi, WifiOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Participant {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface WatchTogetherOverlayProps {
  participants: Participant[];
  isSynced: boolean;
  isConnected: boolean;
  visible: boolean;
  onLeave: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function WatchTogetherOverlay({
  participants,
  isSynced,
  isConnected,
  visible,
  onLeave,
}: WatchTogetherOverlayProps) {
  return (
    <div
      className={cn(
        'absolute top-16 right-4 z-20 flex items-center gap-2 transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      {/* Participant avatars */}
      <div className="flex -space-x-2">
        {participants.map((p) => (
          <Avatar key={p.userId} size="sm" className="ring-2 ring-black">
            {p.avatarUrl ? <AvatarImage src={p.avatarUrl} /> : null}
            <AvatarFallback className="text-[10px]">
              {getInitials(p.displayName)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>

      {/* Sync status badge */}
      <div
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          isSynced
            ? 'bg-green-500/20 text-green-400'
            : 'bg-amber-500/20 text-amber-400',
        )}
      >
        {isConnected ? (
          <Wifi className="size-3" />
        ) : (
          <WifiOff className="size-3" />
        )}
        {!isConnected ? 'Reconnecting...' : isSynced ? 'In Sync' : 'Syncing...'}
      </div>

      {/* Leave button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onLeave}
        className="h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <LogOut className="size-3.5" />
        Leave
      </Button>
    </div>
  );
}
