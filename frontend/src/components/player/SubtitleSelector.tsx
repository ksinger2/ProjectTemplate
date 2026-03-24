'use client';

import { useState, useRef, useEffect } from 'react';
import { Subtitles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  src: string;
}

interface SubtitleSelectorProps {
  tracks: SubtitleTrack[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}

export function SubtitleSelector({ tracks, activeId, onChange }: SubtitleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (tracks.length === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-center w-11 h-11 rounded-md transition-colors',
          'hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
          activeId ? 'text-primary' : 'text-foreground',
        )}
        aria-label="Subtitles"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Subtitles className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full right-0 mb-2 min-w-[160px] bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
          role="listbox"
          aria-label="Subtitle tracks"
        >
          <button
            type="button"
            role="option"
            aria-selected={activeId === null}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
              'hover:bg-secondary/80',
              activeId === null ? 'text-primary font-medium' : 'text-foreground',
            )}
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {activeId === null && <Check className="w-4 h-4" />}
            </span>
            Off
          </button>
          {tracks.map((track) => (
            <button
              type="button"
              key={track.id}
              role="option"
              aria-selected={activeId === track.id}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
                'hover:bg-secondary/80',
                activeId === track.id ? 'text-primary font-medium' : 'text-foreground',
              )}
              onClick={() => {
                onChange(track.id);
                setIsOpen(false);
              }}
            >
              <span className="w-4 h-4 flex items-center justify-center">
                {activeId === track.id && <Check className="w-4 h-4" />}
              </span>
              {track.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
