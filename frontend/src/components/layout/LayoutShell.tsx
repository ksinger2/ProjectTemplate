'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from './NavBar';
import { MobileNav } from './MobileNav';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { useMusicPlayerOptional } from '@/providers/MusicPlayerProvider';
import { cn } from '@/lib/utils';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const player = useMusicPlayerOptional();
  const hasTrack = !!player?.currentTrack;

  return (
    <>
      {!isLoginPage && <NavBar />}
      <main
        id="main-content"
        className={cn(
          'flex-1',
          // Mobile: always reserve space for MobileNav (h-14), plus MiniPlayer (h-16) when active
          hasTrack ? 'pb-[7.5rem]' : 'pb-14',
          // Desktop: no MobileNav, only reserve space for MiniPlayer when active
          hasTrack ? 'md:pb-16' : 'md:pb-0',
        )}
      >
        {children}
      </main>
      {!isLoginPage && <MiniPlayer />}
      {!isLoginPage && <MobileNav />}
    </>
  );
}
