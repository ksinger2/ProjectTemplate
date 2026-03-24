'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, User, Tv, Film, Music, Gamepad2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { RecommendationsInbox } from '@/components/social/RecommendationsInbox';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/shows', label: 'Shows', icon: Tv },
  { href: '/movies', label: 'Movies', icon: Film },
  { href: '/music', label: 'Music', icon: Music },
  { href: '/games', label: 'Games', icon: Gamepad2 },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 100);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 w-full transition-colors duration-200',
        scrolled
          ? 'bg-bb-background/80 backdrop-blur-[20px] border-b border-border'
          : 'bg-transparent',
      )}
    >
      <nav
        className="mx-auto flex h-14 md:h-16 max-w-[1400px] items-center justify-between px-4 md:px-8 lg:px-12"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          aria-label="Blockbuster home"
        >
          <span className="inline-flex items-center rounded-md bg-bb-blue px-3 py-1.5 shadow-md">
            <span className="text-lg md:text-xl font-extrabold tracking-tight text-bb-accent">
              BLOCKBUSTER
            </span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1 ml-8" role="list">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'text-foreground font-bold'
                      : 'text-muted-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right section: search + inbox + friends + avatar */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/search"
                  className={cn(
                    'inline-flex items-center justify-center size-11 rounded-lg',
                    'text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Link>
              }
            />
            <TooltipContent>Search</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/friends"
                  className={cn(
                    'hidden md:inline-flex items-center justify-center size-11 rounded-lg',
                    'text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                  aria-label="Friends"
                >
                  <Users className="h-5 w-5" />
                </Link>
              }
            />
            <TooltipContent>Friends</TooltipContent>
          </Tooltip>

          <RecommendationsInbox />

          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/profile"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                  aria-label="Profile"
                >
                  <Avatar size="default">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Link>
              }
            />
            <TooltipContent>Profile</TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </header>
  );
}
