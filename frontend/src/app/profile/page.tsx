'use client';

import { useState } from 'react';
import { User, LogOut, Clock, CheckCircle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('Guest User');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const email = 'guest@blockbuster.local';

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      if (res.ok) {
        setSaveMessage('Profile updated');
      } else {
        setSaveMessage('Failed to save. Try again.');
      }
    } catch {
      setSaveMessage('Failed to save. Try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleSignOut = () => {
    window.location.href = '/login';
  };

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
                'flex items-center justify-center',
              )}
            >
              <User className="size-10 text-muted-foreground" />
            </div>
            <Button variant="outline" size="sm" disabled>
              Change photo
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
                value={email}
                readOnly
                className="bg-secondary border-border text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={isSaving || !displayName.trim()}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              {saveMessage && (
                <span
                  className={cn(
                    'text-sm',
                    saveMessage.includes('Failed')
                      ? 'text-destructive'
                      : 'text-green-400',
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
              value={0}
              label="Hours Watched"
            />
            <StatCard
              icon={<CheckCircle className="size-5" />}
              value={0}
              label="Titles Completed"
            />
            <StatCard
              icon={<Layers className="size-5" />}
              value={0}
              label="Genres Explored"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Start watching to see your stats!
          </p>
        </div>

        <Separator className="bg-border" />

        {/* Sign out */}
        <div>
          <Button
            variant="outline"
            onClick={handleSignOut}
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
