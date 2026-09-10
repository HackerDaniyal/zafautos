'use client';

import * as React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date-range' | 'boolean' | 'number-range' | 'multi-select';
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, unknown>;
  onChange: (filterId: string, value: unknown) => void;
  onClear: () => void;
  onApply?: () => void;
  className?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function TextFilterInner({
  filter,
  initialValue,
  onChange,
}: {
  filter: FilterConfig;
  initialValue: string;
  onChange: (value: unknown) => void;
}) {
  const [localValue, setLocalValue] = React.useState(initialValue);
  const debouncedValue = useDebounce(localValue, 300);

  React.useEffect(() => {
    onChange(debouncedValue || null);
  }, [debouncedValue, onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
      <Input
        placeholder={filter.placeholder ?? filter.label}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="h-9 w-[200px] pl-9 pr-8 bg-deep-carbon border-iron/30 text-pure-white placeholder:text-steel"
      />
      {localValue && (
        <button
          onClick={() => setLocalValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-pure-white"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

function TextFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const stringValue = String(value ?? '');
  return <TextFilterInner key={stringValue} filter={filter} initialValue={stringValue} onChange={onChange} />;
}

function SelectFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <Select value={String(value ?? 'all')} onValueChange={(v) => onChange(v === 'all' ? null : v)}>
      <SelectTrigger className="h-9 w-[160px] bg-deep-carbon border-iron/30">
        <SelectValue placeholder={filter.label} />
      </SelectTrigger>
      <SelectContent className="bg-carbon border-iron">
        <SelectItem value="all">All {filter.label}</SelectItem>
        {filter.options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MultiSelectFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedValues = Array.isArray(value) ? (value as string[]) : [];

  function toggleOption(optionValue: string) {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValues.length > 0 ? newValues : null);
  }

  function getLabel() {
    if (selectedValues.length === 0) return `All ${filter.label}`;
    if (selectedValues.length === 1) {
      return filter.options?.find((o) => o.value === selectedValues[0])?.label ?? selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 w-[160px] items-center justify-between rounded-[6px] border bg-deep-carbon px-3 text-sm transition-colors',
          selectedValues.length > 0 ? 'border-signal-red/50 text-pure-white' : 'border-iron/30 text-steel'
        )}
      >
        <span className="truncate">{getLabel()}</span>
        <ChevronDownIcon className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-[200px] rounded-[6px] border border-iron bg-carbon p-1 shadow-lg">
            {filter.options?.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm text-pure-white hover:bg-white/5"
              >
                <Checkbox
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={() => toggleOption(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BooleanFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const isActive = value === true || value === 'true';

  return (
    <button
      onClick={() => onChange(isActive ? null : true)}
      className={cn(
        'flex h-9 items-center gap-2 rounded-[6px] border px-3 text-sm transition-colors',
        isActive
          ? 'border-signal-red/50 bg-signal-red/10 text-pure-white'
          : 'border-iron/30 bg-deep-carbon text-steel hover:text-pure-white'
      )}
    >
      <div
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          isActive ? 'bg-signal-red' : 'bg-iron'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-pure-white transition-transform',
            isActive ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </div>
      <span>{filter.label}</span>
    </button>
  );
}

function DateRangeFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const range = (value as { from?: string; to?: string }) ?? {};

  function handleChange(field: 'from' | 'to', fieldValue: string) {
    const newRange = { ...range, [field]: fieldValue || undefined };
    if (!newRange.from && !newRange.to) {
      onChange(null);
    } else {
      onChange(newRange);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        placeholder="From"
        value={range.from ?? ''}
        onChange={(e) => handleChange('from', e.target.value)}
        className="h-9 w-[140px] bg-deep-carbon border-iron/30 text-pure-white placeholder:text-steel"
      />
      <span className="text-steel">–</span>
      <Input
        type="date"
        placeholder="To"
        value={range.to ?? ''}
        onChange={(e) => handleChange('to', e.target.value)}
        className="h-9 w-[140px] bg-deep-carbon border-iron/30 text-pure-white placeholder:text-steel"
      />
    </div>
  );
}

function NumberRangeFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const range = (value as { min?: number; max?: number }) ?? {};

  function handleChange(field: 'min' | 'max', fieldValue: string) {
    const numValue = fieldValue ? Number(fieldValue) : undefined;
    const newRange = { ...range, [field]: numValue };
    if (newRange.min === undefined && newRange.max === undefined) {
      onChange(null);
    } else {
      onChange(newRange);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        placeholder="Min"
        value={range.min ?? ''}
        onChange={(e) => handleChange('min', e.target.value)}
        className="h-9 w-[100px] bg-deep-carbon border-iron/30 text-pure-white placeholder:text-steel"
      />
      <span className="text-steel">–</span>
      <Input
        type="number"
        placeholder="Max"
        value={range.max ?? ''}
        onChange={(e) => handleChange('max', e.target.value)}
        className="h-9 w-[100px] bg-deep-carbon border-iron/30 text-pure-white placeholder:text-steel"
      />
    </div>
  );
}

function FilterBar({
  filters,
  values,
  onChange,
  onClear,
  onApply,
  className,
}: FilterBarProps) {
  const activeCount = React.useMemo(() => {
    let count = 0;
    for (const filter of filters) {
      const value = values[filter.id];
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
  }, [filters, values]);

  function renderFilter(filter: FilterConfig) {
    const value = values[filter.id];

    switch (filter.type) {
      case 'text':
        return <TextFilter filter={filter} value={value} onChange={(v) => onChange(filter.id, v)} />;
      case 'select':
        return <SelectFilter filter={filter} value={value} onChange={(v) => onChange(filter.id, v)} />;
      case 'multi-select':
        return (
          <MultiSelectFilter filter={filter} value={value} onChange={(v) => onChange(filter.id, v)} />
        );
      case 'boolean':
        return <BooleanFilter filter={filter} value={value} onChange={(v) => onChange(filter.id, v)} />;
      case 'date-range':
        return (
          <DateRangeFilter filter={filter} value={value} onChange={(v) => onChange(filter.id, v)} />
        );
      case 'number-range':
        return (
          <NumberRangeFilter filter={filter} value={value} onChange={(v) => onChange(filter.id, v)} />
        );
      default:
        return null;
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="flex items-center gap-2 text-sm text-ash">
        <SlidersHorizontal className="size-4" />
        <span>Filters</span>
        {activeCount > 0 && (
          <Badge variant="default" className="ml-1 px-1.5 py-0 text-xs">
            {activeCount}
          </Badge>
        )}
      </div>

      {filters.map((filter) => (
        <div key={filter.id}>{renderFilter(filter)}</div>
      ))}

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-ash hover:text-pure-white">
          <X className="mr-1 size-3" />
          Clear all
        </Button>
      )}

      {onApply && activeCount > 0 && (
        <Button variant="default" size="sm" onClick={onApply}>
          Apply
        </Button>
      )}
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export { FilterBar };
export type { FilterBarProps, FilterConfig, FilterOption };
