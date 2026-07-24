'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UseFiltersReturn {
  filters: Record<string, unknown>;
  setFilter: (id: string, value: unknown) => void;
  clearFilter: (id: string) => void;
  clearAll: () => void;
  hasActiveFilters: boolean;
  activeCount: number;
}

function useFilters(defaults: Record<string, unknown> = {}): UseFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const result: Record<string, unknown> = { ...defaults };
    searchParams.forEach((value, key) => {
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    });
    return result;
  }, [searchParams, defaults]);

  const setFilter = useCallback(
    (id: string, value: unknown) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === undefined || value === '' || value === 'all') {
        params.delete(id);
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          params.delete(id);
        } else {
          params.set(id, JSON.stringify(value));
        }
      } else if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>).filter(
          ([, v]) => v !== null && v !== undefined && v !== ''
        );
        if (entries.length === 0) {
          params.delete(id);
        } else {
          params.set(id, JSON.stringify(Object.fromEntries(entries)));
        }
      } else {
        params.set(id, String(value));
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const clearFilter = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(id);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push('?', { scroll: false });
  }, [router]);

  const activeCount = useMemo(() => {
    let count = 0;
    for (const [key, value] of Object.entries(filters)) {
      if (key in defaults && JSON.stringify(value) === JSON.stringify(defaults[key])) continue;
      if (value === null || value === undefined || value === '' || value === 'all') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      if (typeof value === 'object' && !Array.isArray(value)) {
        const entries = Object.values(value as Record<string, unknown>).filter(
          (v) => v !== null && v !== undefined && v !== ''
        );
        if (entries.length === 0) continue;
      }
      count++;
    }
    return count;
  }, [filters, defaults]);

  return {
    filters,
    setFilter,
    clearFilter,
    clearAll,
    hasActiveFilters: activeCount > 0,
    activeCount,
  };
}

export { useFilters };
export type { UseFiltersReturn };
