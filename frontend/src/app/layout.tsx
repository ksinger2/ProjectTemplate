import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import { NavBar } from "@/components/layout/NavBar";
import { MobileNav } from "@/components/layout/MobileNav";
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
        <noscript>
          <style>{"#__next{display:none!important}"}</style>
          <div style={{ textAlign: 'center', padding: 50, fontFamily: 'sans-serif' }}>
            <h1>JavaScript Required</h1>
            <p>Blockbuster requires JavaScript to function. Please enable JavaScript in your browser settings.</p>
          </div>
        </noscript>
        <AuthProvider>
          <TooltipProvider>
            <NavBar />
            <main className="flex-1 pb-14 md:pb-0">{children}</main>
            <MobileNav />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
