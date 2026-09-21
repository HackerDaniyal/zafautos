'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface WishlistCompareContextValue {
  wishlistIds: Set<string>;
  compareIds: string[];
  toggleWishlist: (id: string) => void;
  toggleCompare: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  isCompared: (id: string) => boolean;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
}

const WishlistCompareContext = createContext<WishlistCompareContextValue | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function WishlistCompareProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => new Set(loadFromStorage<string[]>('zaf_wishlist', [])));
  const [compareIds, setCompareIds] = useState<string[]>(() => loadFromStorage('zaf_compare', []));

  useEffect(() => {
    saveToStorage('zaf_wishlist', Array.from(wishlistIds));
  }, [wishlistIds]);

  useEffect(() => {
    saveToStorage('zaf_compare', compareIds);
  }, [compareIds]);

  const toggleWishlist = useCallback((id: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }, []);

  const isWishlisted = useCallback((id: string) => wishlistIds.has(id), [wishlistIds]);
  const isCompared = useCallback((id: string) => compareIds.includes(id), [compareIds]);

  const removeFromWishlist = useCallback((id: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setCompareIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlistIds(new Set());
    setCompareIds([]);
  }, []);

  return (
    <WishlistCompareContext.Provider
      value={{ wishlistIds, compareIds, toggleWishlist, toggleCompare, isWishlisted, isCompared, removeFromWishlist, clearWishlist }}
    >
      {children}
    </WishlistCompareContext.Provider>
  );
}

export function useWishlistCompare() {
  const ctx = useContext(WishlistCompareContext);
  if (!ctx) throw new Error('useWishlistCompare must be used within WishlistCompareProvider');
  return ctx;
}
