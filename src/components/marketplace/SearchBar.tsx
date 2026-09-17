'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Car, Tag, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

interface Suggestion {
  type: 'manufacturer' | 'model' | 'vehicle';
  text: string;
  slug?: string;
  subtitle?: string;
}

const SUGGESTION_ICONS: Record<string, React.ElementType> = {
  manufacturer: Tag,
  model: Car,
  vehicle: Hash,
};

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
  const abortRef = useRef<AbortController | null>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [dbSuggestions, setDbSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('zaf_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions from database when user types
  const fetchSuggestions = useCallback(async (term: string) => {
    if (term.length < 2) {
      setDbSuggestions([]);
      return;
    }

    // Cancel any pending request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingSuggestions(true);
    try {
      const res = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(term)}`,
        { signal: controller.signal },
      );
      if (res.ok) {
        const data = await res.json();
        setDbSuggestions(data.suggestions ?? []);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setDbSuggestions([]);
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.trim().length >= 2) {
        fetchSuggestions(value.trim());
      } else {
        setDbSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, fetchSuggestions]);

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
    setDbSuggestions([]);
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
      setDbSuggestions([]);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onChange('');
    setDbSuggestions([]);
    inputRef.current?.focus();
  };

  const showDropdown = isFocused;
  const hasDbSuggestions = dbSuggestions.length > 0;
  const hasRecentSearches = recentSearches.length > 0 && !value.trim();
  const showSearchFor = value.trim().length > 0;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        <label htmlFor={id} className="sr-only">
          Search vehicles
        </label>
        <Search
          className={cn(
            "pointer-events-none absolute left-3.5 h-4 w-4 transition-colors",
            isFocused ? "text-signal-red" : "text-gray-500"
          )}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={id}
          type="search"
          role="combobox"
          autoComplete="off"
          aria-expanded={showDropdown && (showSearchFor || hasDbSuggestions || hasRecentSearches)}
          aria-controls="search-suggestions"
          aria-activedescendant=""
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-full border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 transition-all',
            'placeholder:text-gray-500',
            'focus:outline-none focus:border-[#E5231B] focus:ring-1 focus:ring-[#E5231B]/20',
            isFocused && showDropdown && 'rounded-b-none border-b-transparent shadow-none'
          )}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {showDropdown && (showSearchFor || hasDbSuggestions || hasRecentSearches) && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 overflow-hidden rounded-b-xl border border-gray-200 border-t-0 bg-white shadow-lg animate-in fade-in slide-in-from-top-1"
        >
          <div className="max-h-[60vh] overflow-y-auto p-2">

            {/* Search for this term */}
            {showSearchFor && (
              <div className="mb-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start font-medium text-signal-red py-2 px-3 h-auto hover:bg-gray-100"
                  onClick={() => handleSuggestionClick(value)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search for &quot;{value}&quot;
                </Button>
              </div>
            )}

            {/* Database suggestions */}
            {hasDbSuggestions && (
              <div className="mb-2">
                <div className="px-3 py-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Suggestions
                  </h4>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {dbSuggestions.map((suggestion, idx) => {
                    const Icon = SUGGESTION_ICONS[suggestion.type] ?? Search;
                    return (
                      <li key={`db-${idx}`}>
                        {suggestion.slug ? (
                          <Link
                            href={`/vehicles/${suggestion.slug}`}
                            className="flex items-center h-8 px-3 text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                            onClick={() => {
                              saveRecentSearch(suggestion.text);
                              setIsFocused(false);
                            }}
                          >
                            <Icon className="mr-2 h-3.5 w-3.5 opacity-50" />
                            <span>{suggestion.text}</span>
                          </Link>
                        ) : (
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-8 px-3 text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => handleSuggestionClick(suggestion.text)}
                          >
                            <Icon className="mr-2 h-3.5 w-3.5 opacity-50" />
                            {suggestion.text}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Loading indicator */}
            {isLoadingSuggestions && (
              <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-steel border-t-transparent animate-spin" />
                Searching...
              </div>
            )}

            {/* Recent searches (when empty) */}
            {hasRecentSearches && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Recent
                  </h4>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[10px] uppercase font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {recentSearches.map((term) => (
                    <li key={`recent-${term}`} className="flex items-center justify-between group">
                      <Button
                        variant="ghost"
                        className="flex-1 justify-start h-8 px-3 text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => handleSuggestionClick(term)}
                      >
                        <Clock className="mr-2 h-3.5 w-3.5 opacity-50" />
                        {term}
                      </Button>
                      <button
                        onClick={(e) => removeRecentSearch(e, term)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 text-gray-500 hover:text-signal-red transition-all rounded-md"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
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
