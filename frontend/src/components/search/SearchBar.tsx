'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (q: string) => void;
  defaultExpanded?: boolean;
  className?: string;
}

export function SearchBar({ onSearch, defaultExpanded = false, className }: SearchBarProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(value);
      }, 300);
    },
    [onSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    if (!defaultExpanded) {
      setExpanded(false);
    } else {
      inputRef.current?.focus();
    }
  };

  const handleExpand = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  const handleBlur = () => {
    if (!defaultExpanded && !query) {
      setExpanded(false);
    }
  };

  if (!expanded && !defaultExpanded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('size-11 text-muted-foreground hover:text-foreground', className)}
        onClick={handleExpand}
        aria-label="Open search"
      >
        <Search className="size-5" />
      </Button>
    );
  }

  return (
    <div className={cn('relative flex items-center', className)} role="search">
      <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Search titles, genres..."
        className={cn(
          'pl-9 pr-9 bg-card border-border text-foreground placeholder:text-muted-foreground',
          defaultExpanded ? 'w-full' : 'w-[280px]',
        )}
        aria-label="Search media"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-2 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
