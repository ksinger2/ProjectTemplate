'use client';

import { useState } from 'react';
import { Users, Send, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function FriendsPage() {
  const [friendEmail, setFriendEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendRequest = () => {
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

    // Placeholder: would call POST /api/friends
    setSuccess(`Request sent to ${friendEmail}!`);
    setFriendEmail('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendRequest();
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-foreground">Friends</h1>

        {/* Add friend */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Add Friend</h2>
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
            />
            <Button onClick={handleSendRequest}>
              <Send className="size-4" />
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

        {/* Pending requests - placeholder */}
        {/* Hidden since empty */}

        {/* Friends list - empty state */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Users className="size-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-1">No friends yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Add friends by email to share the experience. Watch together, send recommendations, and more.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => document.querySelector<HTMLInputElement>('input[type="email"]')?.focus()}>
            <UserPlus className="size-4" />
            Add your first friend
          </Button>
        </div>
      </div>
    </main>
  );
}
