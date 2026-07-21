'use client';

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  makes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
  priceRange: [number, number];
  yearRange: [number, number];
  mileageMax: number;
}

interface FilterSidebarProps {
  filters?: Partial<FilterState>;
  onFilterChange?: (filters: Partial<FilterState>) => void;
  onReset?: () => void;
  className?: string;
}

const MAKES = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Lexus'];
const BODY_TYPES = ['SUV', 'Sedan', 'Hatchback', 'Minivan', 'Truck', 'Wagon', 'Van', 'Coupe'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'];
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT'];

function FilterSection({
  title,
  defaultOpen = true,
  count,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-iron/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left transition-colors hover:text-[#B8B8B8]"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ash">{title}</h3>
          {count !== undefined && count > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-signal-red px-1 text-[9px] font-bold text-pure-white">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-steel transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'grid overflow-hidden transition-all duration-200',
          open ? 'grid-rows-[1fr] pb-3 opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => toggle(option)}
          className={cn(
            'rounded-[4px] border px-2.5 py-1 text-[10px] font-medium transition-all duration-150',
            selected.includes(option)
              ? 'border-signal-red bg-signal-red/10 text-pure-white'
              : 'border-iron bg-deep-carbon text-steel hover:border-steel/50 hover:text-ash',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function FilterSidebar({
  filters = {},
  onFilterChange,
  onReset,
}: FilterSidebarProps) {
  const {
    makes = [],
    bodyTypes = [],
    fuelTypes = [],
    transmissions = [],
    priceRange = [0, 100000],
    yearRange = [2000, 2026],
    mileageMax = 200000,
  } = filters;

  const activeCount =
    (makes.length > 0 ? 1 : 0) +
    (bodyTypes.length > 0 ? 1 : 0) +
    (fuelTypes.length > 0 ? 1 : 0) +
    (transmissions.length > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0) +
    (yearRange[0] > 2000 || yearRange[1] < 2026 ? 1 : 0) +
    (mileageMax < 200000 ? 1 : 0);

  const update = (partial: Partial<FilterState>) => {
    onFilterChange?.({ makes, bodyTypes, fuelTypes, transmissions, priceRange, yearRange, mileageMax, ...partial });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-[Oswald] text-sm font-bold uppercase tracking-wider text-pure-white">Filters</h2>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-signal-red px-1.5 text-[10px] font-bold text-pure-white">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 gap-1 px-1.5 text-[10px] text-steel hover:text-pure-white hover:bg-transparent"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Scrollable filter sections */}
      <div className="flex-1 overflow-y-auto -mr-2 pr-2 scrollbar-thin">
        <FilterSection title="Price & Range">
          <div className="space-y-4">
            {/* Price */}
            <div className="space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#6E6E6E]">Price</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: 'Any', range: [0, 100000] as [number, number] },
                  { label: 'Under $5K', range: [0, 5000] as [number, number] },
                  { label: '$5K–$10K', range: [5000, 10000] as [number, number] },
                  { label: '$10K–$20K', range: [10000, 20000] as [number, number] },
                  { label: '$20K–$30K', range: [20000, 30000] as [number, number] },
                  { label: '$30K–$50K', range: [30000, 50000] as [number, number] },
                  { label: '$50K+', range: [50000, 100000] as [number, number] },
                ].map((preset) => {
                  const isActive = priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1];
                  return (
                    <button
                      key={preset.label}
                      onClick={() => update({ priceRange: preset.range })}
                      className={cn(
                        'rounded-[3px] border px-2 py-[5px] text-[9px] font-medium transition-all duration-150',
                        isActive
                          ? 'border-[#E5231B]/60 bg-[#E5231B]/10 text-white'
                          : 'border-[#222222] bg-[#111111] text-[#7A7A7A] hover:border-[#3D3D3D] hover:text-[#B8B8B8]'
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-iron/30" />

            {/* Year */}
            <div className="space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#6E6E6E]">Year</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: 'Any', range: [2000, 2026] as [number, number] },
                  { label: '2024+', range: [2024, 2026] as [number, number] },
                  { label: '2020–2024', range: [2020, 2024] as [number, number] },
                  { label: '2015–2020', range: [2015, 2020] as [number, number] },
                  { label: '2010–2015', range: [2010, 2015] as [number, number] },
                  { label: 'Before 2010', range: [2000, 2010] as [number, number] },
                ].map((preset) => {
                  const isActive = yearRange[0] === preset.range[0] && yearRange[1] === preset.range[1];
                  return (
                    <button
                      key={preset.label}
                      onClick={() => update({ yearRange: preset.range })}
                      className={cn(
                        'rounded-[3px] border px-2 py-[5px] text-[9px] font-medium transition-all duration-150',
                        isActive
                          ? 'border-[#E5231B]/60 bg-[#E5231B]/10 text-white'
                          : 'border-[#222222] bg-[#111111] text-[#7A7A7A] hover:border-[#3D3D3D] hover:text-[#B8B8B8]'
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-iron/30" />

            {/* Max Mileage */}
            <div className="space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#6E6E6E]">Max Mileage</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: 'Any', value: 200000 },
                  { label: '50K km', value: 50000 },
                  { label: '100K km', value: 100000 },
                  { label: '150K km', value: 150000 },
                  { label: '200K km', value: 200000 },
                ].map((preset) => {
                  const isActive = mileageMax === preset.value;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => update({ mileageMax: preset.value })}
                      className={cn(
                        'rounded-[3px] border px-2 py-[5px] text-[9px] font-medium transition-all duration-150',
                        isActive
                          ? 'border-[#E5231B]/60 bg-[#E5231B]/10 text-white'
                          : 'border-[#222222] bg-[#111111] text-[#7A7A7A] hover:border-[#3D3D3D] hover:text-[#B8B8B8]'
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Make" count={makes.length}>
          <CheckboxGroup
            options={MAKES}
            selected={makes}
            onChange={(v) => update({ makes: v })}
          />
        </FilterSection>

        <FilterSection title="Body Type" count={bodyTypes.length}>
          <CheckboxGroup
            options={BODY_TYPES}
            selected={bodyTypes}
            onChange={(v) => update({ bodyTypes: v })}
          />
        </FilterSection>

        <FilterSection title="Fuel Type" count={fuelTypes.length}>
          <CheckboxGroup
            options={FUEL_TYPES}
            selected={fuelTypes}
            onChange={(v) => update({ fuelTypes: v })}
          />
        </FilterSection>

        <FilterSection title="Transmission" count={transmissions.length}>
          <CheckboxGroup
            options={TRANSMISSIONS}
            selected={transmissions}
            onChange={(v) => update({ transmissions: v })}
          />
        </FilterSection>
      </div>
    </div>
  );
}
