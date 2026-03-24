'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMOJI_GRID = [
  '\u{2764}\u{FE0F}',  // red heart
  '\u{1F602}',          // face with tears of joy
  '\u{1F631}',          // face screaming in fear
  '\u{1F525}',          // fire
  '\u{1F44D}',          // thumbs up
  '\u{1F44E}',          // thumbs down
  '\u{1F60D}',          // heart eyes
  '\u{1F92F}',          // exploding head
  '\u{1F62D}',          // loudly crying face
  '\u{1F389}',          // party popper
  '\u{1F480}',          // skull
  '\u{1F624}',          // face with steam
  '\u{1F97A}',          // pleading face
  '\u{1F440}',          // eyes
  '\u{1F4AF}',          // 100
  '\u{1F64C}',          // raising hands
  '\u{1F60E}',          // sunglasses face
  '\u{1F92E}',          // vomiting
  '\u{1F608}',          // smiling face with horns
  '\u{2728}',           // sparkles
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPicker({ onSelect, disabled }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const lastSent = useRef(0);

  const handleSelect = useCallback(
    (emoji: string) => {
      // Client-side rate limit: 1 emoji per second
      const now = Date.now();
      if (now - lastSent.current < 1000) return;
      lastSent.current = now;

      onSelect(emoji);
      setIsOpen(false);
    },
    [onSelect],
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const controlBtnClass =
    'flex items-center justify-center w-11 h-11 rounded-md hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(controlBtnClass, isOpen && 'bg-white/20')}
        aria-label="Emoji reactions"
        title="Emoji reactions"
      >
        <Smile className="w-5 h-5 text-foreground" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-[#132743] rounded-lg p-2 shadow-xl border border-border z-50">
          <div className="grid grid-cols-5 gap-1" style={{ width: '200px' }}>
            {EMOJI_GRID.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(emoji)}
                className="size-9 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors text-xl"
                aria-label={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
