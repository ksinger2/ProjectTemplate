'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BurstEmoji {
  id: string;
  emoji: string;
  x: number;
  displayName?: string;
}

export function useEmojiBurst() {
  const [emojis, setEmojis] = useState<BurstEmoji[]>([]);

  const addEmoji = useCallback(
    (emoji: string, displayName?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      // Random x position in the right portion of the screen (60-90%)
      const x = 60 + Math.random() * 30;

      setEmojis((prev) => [...prev, { id, emoji, x, displayName }]);

      // Remove after animation completes (2s)
      setTimeout(() => {
        setEmojis((prev) => prev.filter((e) => e.id !== id));
      }, 2200);
    },
    [],
  );

  return { emojis, addEmoji };
}

interface EmojiBurstOverlayProps {
  emojis: BurstEmoji[];
}

export function EmojiBurstOverlay({ emojis }: EmojiBurstOverlayProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {emojis.map((burst) => (
          <motion.div
            key={burst.id}
            initial={{
              opacity: 1,
              y: '80vh',
              x: `${burst.x}vw`,
              scale: 1,
            }}
            animate={{
              opacity: 0,
              y: '10vh',
              scale: 1.5,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              ease: 'easeOut',
            }}
            className="absolute flex flex-col items-center"
          >
            <span className="text-4xl drop-shadow-lg">{burst.emoji}</span>
            {burst.displayName && (
              <span className="text-xs text-white/70 font-medium mt-0.5 whitespace-nowrap drop-shadow">
                {burst.displayName}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
