'use client';

import { useState, useCallback, useMemo } from 'react';

interface UseBulkSelectionReturn<T> {
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (items: T[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  selectedCount: number;
  selectedIds: string[];
}

function useBulkSelection<T extends { id: string }>(items: T[]): UseBulkSelectionReturn<T> {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (allItems: T[]) => {
      setSelected((prev) => {
        const allIds = allItems.map((item) => item.id);
        const allSelected = allIds.every((id) => prev.has(id));

        if (allSelected) {
          const next = new Set(prev);
          allIds.forEach((id) => next.delete(id));
          return next;
        } else {
          const next = new Set(prev);
          allIds.forEach((id) => next.add(id));
          return next;
        }
      });
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const selectedCount = useMemo(() => selected.size, [selected]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return {
    selected,
    toggle,
    toggleAll,
    clearSelection,
    isSelected,
    selectedCount,
    selectedIds,
  };
}

export { useBulkSelection };
