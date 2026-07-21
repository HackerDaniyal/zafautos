'use client';

import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type FilterState } from '@/components/marketplace/FilterSidebar';

interface ActiveFiltersProps {
  filters: Partial<FilterState>;
  onRemove: (key: keyof FilterState, value?: string) => void;
  onClearAll: () => void;
  className?: string;
}

function buildFilterChips(filters: Partial<FilterState>) {
  const chips: { label: string; key: keyof FilterState; value?: string }[] = [];

  (filters.makes ?? []).forEach((v) => chips.push({ label: v, key: 'makes', value: v }));
  (filters.bodyTypes ?? []).forEach((v) => chips.push({ label: v, key: 'bodyTypes', value: v }));
  (filters.fuelTypes ?? []).forEach((v) => chips.push({ label: v, key: 'fuelTypes', value: v }));
  (filters.transmissions ?? []).forEach((v) => chips.push({ label: v, key: 'transmissions', value: v }));

  if (filters.priceRange) {
    chips.push({
      label: `$${filters.priceRange[0].toLocaleString()} â€“ $${filters.priceRange[1].toLocaleString()}`,
      key: 'priceRange',
    });
  }
  if (filters.yearRange) {
    chips.push({
      label: `${filters.yearRange[0]} â€“ ${filters.yearRange[1]}`,
      key: 'yearRange',
    });
  }
  if (filters.mileageMax !== undefined) {
    chips.push({
      label: `Max ${filters.mileageMax.toLocaleString()} km`,
      key: 'mileageMax',
    });
  }

  return chips;
}

export function ActiveFilters({ filters, onRemove, onClearAll, className }: ActiveFiltersProps) {
  const chips = buildFilterChips(filters);

  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="flex items-center gap-1.5 text-xs text-steel font-medium shrink-0">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Active Filters:
      </span>

      {chips.map((chip, i) => (
        <Badge
          key={`${chip.key}-${chip.value ?? i}`}
          variant="secondary"
          className="flex items-center gap-1 pr-1 text-xs font-medium"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remove filter: ${chip.label}`}
            onClick={() => onRemove(chip.key, chip.value)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-steel/20 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-xs text-steel hover:text-pure-white hover:bg-transparent"
      >
        Clear all
      </Button>
    </div>
  );
}
