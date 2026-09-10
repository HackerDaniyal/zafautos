'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Search, X, ChevronDown } from 'lucide-react';

interface SearchableSelectOption {
  id: string;
  name: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Type to search...',
  emptyText = 'No results found',
  className,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  const filtered = React.useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(lower) ||
        o.subtitle?.toLowerCase().includes(lower),
    );
  }, [options, search]);

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  React.useEffect(() => {
    if (open) {
      setSearch('');
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          onChange(filtered[highlightedIndex].id);
          setOpen(false);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  }

  function selectItem(id: string) {
    onChange(id === value ? null : id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-[6px] border bg-deep-carbon px-3 text-sm transition-colors',
          open ? 'border-signal-red ring-[3px] ring-signal-red/20' : 'border-iron/30 hover:border-iron',
          selectedOption ? 'text-pure-white' : 'text-steel',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className="truncate">
          {selectedOption ? (
            <span>
              {selectedOption.name}
              {selectedOption.subtitle && (
                <span className="ml-1 text-xs text-steel">{selectedOption.subtitle}</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className={cn('ml-2 size-4 shrink-0 text-steel transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full min-w-[240px] rounded-[6px] border border-iron bg-carbon shadow-lg overflow-hidden">
            <div className="flex items-center border-b border-iron/30 px-3">
              <Search className="size-4 shrink-0 text-steel" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="h-9 flex-1 bg-transparent px-2 text-sm text-pure-white placeholder:text-steel outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-steel hover:text-pure-white">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div ref={listRef} className="max-h-[240px] overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-steel">{emptyText}</p>
              ) : (
                filtered.map((opt, i) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectItem(opt.id)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-[4px] px-3 py-2 text-left text-sm transition-colors',
                      opt.id === value
                        ? 'bg-signal-red/10 text-signal-red'
                        : i === highlightedIndex
                          ? 'bg-white/5 text-pure-white'
                          : 'text-ash hover:bg-white/5 hover:text-pure-white',
                    )}
                  >
                    <span className="truncate">{opt.name}</span>
                    {opt.subtitle && (
                      <span className="ml-auto shrink-0 text-xs text-steel">{opt.subtitle}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
