'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock, CheckCircle, Flame, Calendar, Sun, CloudSun, Sunset, Moon,
  BarChart3, Loader2, RefreshCw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatsData {
  totalHours: number;
  monthHours: number;
  titlesCompleted: number;
  topGenres: { genre: string; hours: number }[];
  mostWatched: {
    id: string;
    title: string;
    type: string;
    posterUrl: string | null;
    hours: number;
  } | null;
  longestBinge: { date: string; hours: number } | null;
  watchStreak: number;
  timeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  top10: {
    id: string;
    title: string;
    posterUrl: string | null;
    hours: number;
  }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHours(h: number): string {
  if (h < 0.1) return '0h';
  if (h < 1) return `${Math.round(h * 60)}m`;
  return `${Math.round(h * 10) / 10}h`;
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function StatsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="text-center space-y-4 py-8">
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-16 w-32 mx-auto" />
        <Skeleton className="h-4 w-40 mx-auto" />
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-6 space-y-4">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stats', { credentials: 'include' });
      if (!res.ok) {
        setError('Failed to load stats.');
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      } else {
        setError(json.error || 'Failed to load stats.');
      }
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Empty state
  const isEmpty =
    stats &&
    stats.totalHours === 0 &&
    stats.titlesCompleted === 0 &&
    stats.top10.length === 0;

  // Find max genre hours for bar scaling
  const maxGenreHours = stats?.topGenres?.reduce((m, g) => Math.max(m, g.hours), 0) ?? 1;

  // Time of day entries
  const timeOfDayEntries = stats
    ? [
        { label: 'Morning', icon: <Sun className="size-5" />, hours: stats.timeOfDay.morning },
        { label: 'Afternoon', icon: <CloudSun className="size-5" />, hours: stats.timeOfDay.afternoon },
        { label: 'Evening', icon: <Sunset className="size-5" />, hours: stats.timeOfDay.evening },
        { label: 'Night', icon: <Moon className="size-5" />, hours: stats.timeOfDay.night },
      ]
    : [];

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Loading */}
        {isLoading && <StatsSkeleton />}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <BarChart3 className="size-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-foreground">{error}</p>
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-bb-accent-hover transition-colors"
            >
              <RefreshCw className="size-4" />
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {isEmpty && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <BarChart3 className="size-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-foreground">
              Start watching to build your stats!
            </p>
            <Link
              href="/"
              className="text-sm font-medium text-primary hover:text-bb-accent-hover transition-colors"
            >
              Browse library &rarr;
            </Link>
          </div>
        )}

        {/* Stats content */}
        {stats && !isEmpty && !isLoading && !error && (
          <>
            {/* Hero */}
            <div className="text-center space-y-2 py-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Your Blockbuster Wrapped
              </h1>
              <p className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-bb-accent to-amber-500">
                {formatHours(stats.totalHours)}
              </p>
              <p className="text-muted-foreground text-sm">
                total watch time
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Watch Time */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-5" />
                  <span className="text-sm font-medium">Total Watch Time</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {formatHours(stats.totalHours)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatHours(stats.monthHours)} this month
                </p>
              </div>

              {/* Titles Completed */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="size-5" />
                  <span className="text-sm font-medium">Titles Completed</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {stats.titlesCompleted}
                </p>
              </div>

              {/* Top Genres */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart3 className="size-5" />
                  <span className="text-sm font-medium">Top Genres</span>
                </div>
                {stats.topGenres.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topGenres.slice(0, 5).map((g) => (
                      <div key={g.genre} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground font-medium capitalize">{g.genre}</span>
                          <span className="text-muted-foreground">{formatHours(g.hours)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-bb-accent to-amber-500 transition-all"
                            style={{ width: `${Math.max(4, (g.hours / maxGenreHours) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Most Watched */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart3 className="size-5" />
                  <span className="text-sm font-medium">Most Watched</span>
                </div>
                {stats.mostWatched ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-[72px] rounded bg-secondary overflow-hidden flex-shrink-0">
                      {stats.mostWatched.posterUrl ? (
                        <img
                          src={`/api/media/${stats.mostWatched.id}/thumbnail`}
                          alt={stats.mostWatched.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                          <BarChart3 className="size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {stats.mostWatched.title}
                      </p>
                      <span className="inline-block mt-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded capitalize">
                        {stats.mostWatched.type}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatHours(stats.mostWatched.hours)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </div>

              {/* Longest Binge */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Flame className="size-5" />
                  <span className="text-sm font-medium">Longest Binge</span>
                </div>
                {stats.longestBinge ? (
                  <>
                    <p className="text-3xl font-bold text-foreground">
                      {formatHours(stats.longestBinge.hours)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(stats.longestBinge.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </div>

              {/* Watch Streak */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-5" />
                  <span className="text-sm font-medium">Watch Streak</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {stats.watchStreak}
                </p>
                <p className="text-sm text-muted-foreground">
                  consecutive days
                </p>
              </div>

              {/* Time of Day */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-5" />
                  <span className="text-sm font-medium">Time of Day</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {timeOfDayEntries.map((entry) => (
                    <div key={entry.label} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{entry.icon}</span>
                      <div>
                        <p className="text-xs text-muted-foreground">{entry.label}</p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatHours(entry.hours)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Top 10 */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-3 md:col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart3 className="size-5" />
                  <span className="text-sm font-medium">Your Top 10</span>
                </div>
                {stats.top10.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.top10.map((item, idx) => (
                      <Link
                        key={item.id}
                        href={`/media/${item.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <span className="text-sm font-bold text-muted-foreground w-6 text-right">
                          {idx + 1}
                        </span>
                        <div className="w-8 h-12 rounded bg-secondary overflow-hidden flex-shrink-0">
                          {item.posterUrl ? (
                            <img
                              src={`/api/media/${item.id}/thumbnail`}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                              <BarChart3 className="size-3" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground flex-1 truncate">
                          {item.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatHours(item.hours)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
