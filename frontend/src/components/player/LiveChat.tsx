'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Users, Wifi, WifiOff } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/useSocket';

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  text: string;
  timestamp: string;
}

interface LiveChatProps {
  mediaId: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function LiveChat({ mediaId, isOpen, onClose }: LiveChatProps) {
  const { isConnected, emit, on, off } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasJoinedRef = useRef(false);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Join/leave room when panel opens/closes or mediaId changes
  useEffect(() => {
    if (!isOpen || !isConnected) return;

    emit('chat:join', { mediaId });
    hasJoinedRef.current = true;

    return () => {
      if (hasJoinedRef.current) {
        emit('chat:leave', { mediaId });
        hasJoinedRef.current = false;
      }
    };
  }, [isOpen, isConnected, mediaId, emit]);

  // Listen for incoming messages and online count updates
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (data: unknown) => {
      const msg = data as ChatMessage;
      if (msg && typeof msg === 'object' && 'id' in msg && 'text' in msg) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleOnlineCount = (data: unknown) => {
      const payload = data as { count: number };
      if (payload && typeof payload === 'object' && 'count' in payload) {
        setOnlineCount(payload.count);
      }
    };

    const unsubMessage = on('chat:message', handleMessage);
    const unsubCount = on('chat:online_count', handleOnlineCount);

    return () => {
      unsubMessage();
      unsubCount();
    };
  }, [isOpen, on, off]);

  // Clear messages when mediaId changes
  useEffect(() => {
    setMessages([]);
    setOnlineCount(0);
  }, [mediaId]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !isConnected) return;

    setIsSending(true);
    emit('chat:message', { mediaId, text: trimmed }, () => {
      setIsSending(false);
    });

    // Optimistic: clear input immediately. Server echo will add to messages.
    setInputText('');

    // Fallback: release sending lock after a short delay in case callback never fires
    setTimeout(() => setIsSending(false), 2000);
  }, [inputText, isSending, isConnected, mediaId, emit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Prevent player keyboard shortcuts from firing
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="
            fixed right-0 top-0 bottom-0 z-50
            w-80 max-md:w-full
            bg-black/90 backdrop-blur-md border-l border-border
            flex flex-col
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Live Chat</h2>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                {onlineCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="size-3.5 text-green-500" />
              ) : (
                <WifiOff className="size-3.5 text-red-400" />
              )}
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-2">
                <Users className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {onlineCount <= 1
                    ? 'No one else is watching'
                    : 'No messages yet. Say hello!'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2 group">
                    <Avatar size="sm" className="mt-0.5 shrink-0">
                      {msg.avatarUrl ? (
                        <AvatarImage src={msg.avatarUrl} />
                      ) : (
                        <AvatarFallback>
                          {msg.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <span className="text-bb-accent text-xs font-semibold mr-1.5">
                        {msg.displayName}
                      </span>
                      <span className="text-white text-xs leading-relaxed">
                        {msg.text}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="shrink-0 px-3 py-2 border-t border-border">
            {!isConnected ? (
              <p className="text-xs text-red-400 text-center py-1">
                Disconnected. Reconnecting...
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Send a message..."
                  className="flex-1 bg-secondary border-border text-sm h-8 px-3"
                  disabled={isSending}
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isSending}
                  className="bg-bb-accent text-black hover:bg-bb-accent/90 h-8 px-3 shrink-0"
                >
                  <Send className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
