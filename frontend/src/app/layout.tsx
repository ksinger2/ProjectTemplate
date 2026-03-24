import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import { MusicPlayerProvider } from "@/providers/MusicPlayerProvider";
import { NavBar } from "@/components/layout/NavBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { LayoutShell } from "@/components/layout/LayoutShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blockbuster — Your Personal Video Store",
  description: "Private media streaming platform inspired by the classic Blockbuster Video experience",
  manifest: "/manifest.json",
  other: {
    "theme-color": "#FFD100",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bb-background text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-bb-accent focus:text-black focus:font-semibold focus:rounded-md focus:outline-none"
        >
          Skip to content
        </a>
        <noscript>
          <style>{"#__next{display:none!important}"}</style>
          <div style={{ textAlign: 'center', padding: 50, fontFamily: 'sans-serif' }}>
            <h1>JavaScript Required</h1>
            <p>Blockbuster requires JavaScript to function. Please enable JavaScript in your browser settings.</p>
          </div>
        </noscript>
        <AuthProvider>
          <MusicPlayerProvider>
            <TooltipProvider>
              <LayoutShell>
                {children}
              </LayoutShell>
            </TooltipProvider>
          </MusicPlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
