'use client';

import { X } from 'lucide-react';

interface KeyboardShortcutHelpProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', description: 'Play / Pause' },
  { key: 'F', description: 'Toggle fullscreen' },
  { key: 'M', description: 'Toggle mute' },
  { key: 'P', description: 'Toggle Picture-in-Picture' },
  { key: 'H', description: 'Toggle half-screen mode' },
  { key: '?', description: 'Show this help' },
  { key: 'Left Arrow', description: 'Seek back 10s' },  // Using text instead of symbol
  { key: 'Right Arrow', description: 'Seek forward 10s' },
  { key: 'Up Arrow', description: 'Volume up' },
  { key: 'Down Arrow', description: 'Volume down' },
  { key: 'Esc', description: 'Close overlay / Exit fullscreen' },
] as const;

export function KeyboardShortcutHelp({ onClose }: KeyboardShortcutHelpProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bb-surface,#132743)] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-white text-lg font-semibold">Keyboard Shortcuts</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-5 py-3">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
            >
              <span className="text-white/70 text-sm">{shortcut.description}</span>
              <kbd className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-xs font-mono font-medium text-white bg-white/10 border border-white/20 rounded">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
