'use client';

import { usePathname } from 'next/navigation';
import { NavBar } from './NavBar';
import { MobileNav } from './MobileNav';
import { MiniPlayer } from '@/components/player/MiniPlayer';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <>
      {!isLoginPage && <NavBar />}
      <main className="flex-1 pb-14 md:pb-0">{children}</main>
      {!isLoginPage && <MiniPlayer />}
      {!isLoginPage && <MobileNav />}
    </>
  );
}
