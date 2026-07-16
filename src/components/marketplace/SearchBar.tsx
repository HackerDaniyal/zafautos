'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const POPULAR_SEARCHES = [
  'Toyota Land Cruiser',
  'Honda CR-V',
  'Hybrid Vehicles',
  'Nissan X-Trail',
  'Subaru Forester',
];

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search make, model, year…',
  className,
  id = 'marketplace-search',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zaf_recent_searches');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    try {
      const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('zaf_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search', e);
    }
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('zaf_recent_searches');
  };

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem('zaf_recent_searches', JSON.stringify(updated));
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSubmit?.(suggestion);
    saveRecentSearch(suggestion);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit?.(value);
      saveRecentSearch(value);
      setIsFocused(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      onChange('');
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const showDropdown = isFocused && (!value.trim() || value.trim().length > 0);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        <label htmlFor={id} className="sr-only">
          Search vehicles
        </label>
        <Search
          className={cn(
            "pointer-events-none absolute left-3.5 h-4 w-4 transition-colors",
            isFocused ? "text-primary" : "text-muted-foreground"
          )}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={id}
          type="search"
          role="searchbox"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-full border border-input bg-background/95 backdrop-blur py-3 pl-10 pr-10 text-sm shadow-sm transition-all',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary',
            isFocused && showDropdown && 'rounded-b-none border-b-transparent shadow-none ring-0'
          )}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-background transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 overflow-hidden rounded-b-xl border border-t-0 border-primary shadow-lg bg-background animate-in fade-in slide-in-from-top-1">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            
            {/* Search Suggestions (if typing) */}
            {value.trim().length > 0 && (
              <div className="mb-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start font-medium text-primary py-2 px-3 h-auto"
                  onClick={() => handleSuggestionClick(value)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search for &quot;{value}&quot;
                </Button>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && !value.trim() && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" /> Recent
                  </h4>
                  <button 
                    onClick={clearRecentSearches}
                    className="text-[10px] uppercase font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {recentSearches.map((term) => (
                    <li key={`recent-${term}`} className="flex items-center justify-between group">
                      <Button
                        variant="ghost"
                        className="flex-1 justify-start h-8 px-3 text-sm font-normal text-muted-foreground hover:text-foreground"
                        onClick={() => handleSuggestionClick(term)}
                      >
                        <Clock className="mr-2 h-3.5 w-3.5 opacity-50" />
                        {term}
                      </Button>
                      <button 
                        onClick={(e) => removeRecentSearch(e, term)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 text-muted-foreground hover:text-destructive transition-all rounded-md"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Popular Searches */}
            {!value.trim() && (
              <div>
                <div className="px-3 py-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Popular Searches
                  </h4>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {POPULAR_SEARCHES.map((term) => (
                    <li key={`popular-${term}`}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-8 px-3 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        onClick={() => handleSuggestionClick(term)}
                      >
                        <Search className="mr-2 h-3.5 w-3.5 opacity-50" />
                        {term}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
