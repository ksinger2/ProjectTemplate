'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, LogOut, Clock, CheckCircle, Layers, Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg p-5 border border-border text-center space-y-2">
      <div className="flex justify-center text-muted-foreground">{icon}</div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

interface WatchStats {
  hoursWatched: number;
  titlesCompleted: number;
  genresExplored: number;
}

function formatJoinDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}

export default function ProfilePage() {
  const { user, logout, isLoading: authLoading, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [stats, setStats] = useState<WatchStats>({
    hoursWatched: 0,
    titlesCompleted: 0,
    genresExplored: 0,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync display name from user
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [user]);

  // Fetch watch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch completed items
        const completedRes = await fetch('/api/watch-history?status=completed', {
          credentials: 'include',
        });
        // Fetch in-progress items for total hours
        const inProgressRes = await fetch('/api/watch-history?status=in_progress', {
          credentials: 'include',
        });

        let totalSeconds = 0;
        let titlesCompleted = 0;
        const genreSet = new Set<string>();

        if (completedRes.ok) {
          const completedJson = await completedRes.json();
          if (completedJson.success && Array.isArray(completedJson.data)) {
            titlesCompleted = completedJson.data.length;
            for (const entry of completedJson.data) {
              totalSeconds += entry.positionSeconds || 0;
              if (entry.media?.genres) {
                for (const g of entry.media.genres) genreSet.add(g);
              }
            }
          }
        }

        if (inProgressRes.ok) {
          const inProgressJson = await inProgressRes.json();
          if (inProgressJson.success && Array.isArray(inProgressJson.data)) {
            for (const entry of inProgressJson.data) {
              totalSeconds += entry.positionSeconds || 0;
              if (entry.media?.genres) {
                for (const g of entry.media.genres) genreSet.add(g);
              }
            }
          }
        }

        setStats({
          hoursWatched: Math.round((totalSeconds / 3600) * 10) / 10,
          titlesCompleted,
          genresExplored: genreSet.size,
        });
      } catch {
        // Keep defaults
      }
    }

    if (user) fetchStats();
  }, [user]);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      if (res.ok) {
        setSaveMessage('Profile updated');
        await refreshUser();
      } else {
        const json = await res.json().catch(() => null);
        setSaveMessage(json?.error || 'Failed to save. Try again.');
      }
    } catch {
      setSaveMessage('Failed to save. Try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type client-side
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setSaveMessage('Only JPEG and PNG images are allowed.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    // Validate file size client-side (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage('Avatar must be under 2MB.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.avatarUrl) {
          setAvatarUrl(`${json.data.avatarUrl}?t=${Date.now()}`);
          setSaveMessage('Avatar updated');
          setTimeout(() => setSaveMessage(''), 3000);
          // Refresh the auth context so the avatar updates globally (e.g. NavBar)
          await refreshUser();
        }
      } else {
        const errJson = await res.json().catch(() => null);
        setSaveMessage(errJson?.error || 'Failed to upload avatar. Try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch {
      setSaveMessage('Failed to upload avatar. Try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) return null;

  const hasStats = stats.hoursWatched > 0 || stats.titlesCompleted > 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>

        {/* Avatar + form */}
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'size-24 rounded-full bg-secondary border-2 border-border',
                'flex items-center justify-center overflow-hidden relative',
              )}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="size-10 text-muted-foreground" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingAvatar ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              {isUploadingAvatar ? 'Uploading...' : 'Change photo'}
            </Button>
          </div>

          {/* Form */}
          <div className="flex-1 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="display-name" className="text-sm font-medium text-foreground">
                Display Name
              </label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-card border-border"
                maxLength={50}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                value={user.email}
                readOnly
                className="bg-secondary border-border text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Member since
              </label>
              <p className="text-sm text-foreground">
                {formatJoinDate(user.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={isSaving || !displayName.trim()}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              {saveMessage && (
                <span
                  className={cn(
                    'text-sm',
                    saveMessage.includes('Failed') || saveMessage.includes('error')
                      ? 'text-destructive'
                      : 'text-[#46d369]',
                  )}
                >
                  {saveMessage}
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Watch Stats */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Watch Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<Clock className="size-5" />}
              value={stats.hoursWatched}
              label="Hours Watched"
            />
            <StatCard
              icon={<CheckCircle className="size-5" />}
              value={stats.titlesCompleted}
              label="Titles Completed"
            />
            <StatCard
              icon={<Layers className="size-5" />}
              value={stats.genresExplored}
              label="Genres Explored"
            />
          </div>
          {!hasStats && (
            <p className="text-sm text-muted-foreground text-center">
              Start watching to see your stats!
            </p>
          )}
          <Link
            href="/stats"
            className="inline-flex items-center text-sm font-medium text-primary hover:text-bb-accent-hover transition-colors"
          >
            See full stats &rarr;
          </Link>
        </div>

        <Separator className="bg-border" />

        {/* Sign out */}
        <div>
          <Button
            variant="outline"
            onClick={logout}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </main>
  );
}
