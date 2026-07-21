'use client';

import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = {
  value: string;
  label: string;
};

interface SortSelectProps {
  options?: SortOption[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const defaultOptions: SortOption[] = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'year-desc', label: 'Year: Newest First' },
  { value: 'year-asc', label: 'Year: Oldest First' },
  { value: 'mileage-asc', label: 'Mileage: Low to High' },
];

export function SortSelect({
  options = defaultOptions,
  defaultValue = options[0].value,
  onChange,
  className,
}: SortSelectProps) {
  return (
    <Select defaultValue={defaultValue} onValueChange={onChange}>
      <SelectTrigger className={cn('w-[200px] rounded-[6px] border border-iron bg-deep-carbon text-pure-white', className)}>
        <ArrowUpDown className="mr-2 h-4 w-4 text-steel" />
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
