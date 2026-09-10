'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  makes: string[];
  models: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
  countries: string[];
  priceRange: [number, number];
  yearRange: [number, number];
  mileageMax: number;
}

export type FilterOption = { id: string; name: string; count: number };

export interface FilterOptions {
  makes?: FilterOption[];
  models?: FilterOption[];
  bodyTypes?: FilterOption[];
  fuelTypes?: FilterOption[];
  transmissions?: FilterOption[];
  countries?: FilterOption[];
}

interface FilterSidebarProps {
  filters?: Partial<FilterState>;
  onFilterChange?: (filters: Partial<FilterState>) => void;
  onReset?: () => void;
  filterOptions?: FilterOptions;
  className?: string;
}

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
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left transition-colors hover:text-gray-400"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">{title}</h3>
          {count !== undefined && count > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-signal-red px-1 text-[9px] font-bold text-gray-900">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-gray-500 transition-transform duration-200',
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
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (name: string) => {
    const next = selected.includes(name)
      ? selected.filter((v) => v !== name)
      : [...selected, name];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => toggle(option.name)}
          className={cn(
            'rounded-[4px] border px-2.5 py-1 text-[10px] font-medium transition-all duration-150',
            selected.includes(option.name)
              ? 'border-signal-red bg-signal-red/10 text-gray-900'
              : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-400 hover:text-gray-600',
          )}
        >
          {option.name}
          {option.count > 0 && (
            <span className="ml-1 text-[8px] opacity-60">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function FilterSidebar({
  filters = {},
  onFilterChange,
  onReset,
  filterOptions = {},
}: FilterSidebarProps) {
  const {
    makes = [],
    models = [],
    bodyTypes = [],
    fuelTypes = [],
    transmissions = [],
    countries = [],
    priceRange = [0, 100000],
    yearRange = [2000, 2026],
    mileageMax = 200000,
  } = filters;

  const activeCount =
    (makes.length > 0 ? 1 : 0) +
    (models.length > 0 ? 1 : 0) +
    (bodyTypes.length > 0 ? 1 : 0) +
    (fuelTypes.length > 0 ? 1 : 0) +
    (transmissions.length > 0 ? 1 : 0) +
    (countries.length > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0) +
    (yearRange[0] > 2000 || yearRange[1] < 2026 ? 1 : 0) +
    (mileageMax < 200000 ? 1 : 0);

  const update = (partial: Partial<FilterState>) => {
    onFilterChange?.({ makes, models, bodyTypes, fuelTypes, transmissions, countries, priceRange, yearRange, mileageMax, ...partial });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-[Oswald] text-sm font-bold uppercase tracking-wider text-gray-900">Filters</h2>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-signal-red px-1.5 text-[10px] font-bold text-gray-900">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 gap-1 px-1.5 text-[10px] text-gray-500 hover:text-gray-900 hover:bg-transparent"
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
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Price</span>
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
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-400'
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* Year */}
            <div className="space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Year</span>
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
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-400'
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* Max Mileage */}
            <div className="space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Max Mileage</span>
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
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-400'
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
            options={filterOptions.makes ?? []}
            selected={makes}
            onChange={(v) => update({ makes: v, models: [] })}
          />
        </FilterSection>

        <FilterSection title="Model" count={models.length}>
          <CheckboxGroup
            options={filterOptions.models ?? []}
            selected={models}
            onChange={(v) => update({ models: v })}
          />
        </FilterSection>

        <FilterSection title="Body Type" count={bodyTypes.length}>
          <CheckboxGroup
            options={filterOptions.bodyTypes ?? []}
            selected={bodyTypes}
            onChange={(v) => update({ bodyTypes: v })}
          />
        </FilterSection>

        <FilterSection title="Fuel Type" count={fuelTypes.length}>
          <CheckboxGroup
            options={filterOptions.fuelTypes ?? []}
            selected={fuelTypes}
            onChange={(v) => update({ fuelTypes: v })}
          />
        </FilterSection>

        <FilterSection title="Transmission" count={transmissions.length}>
          <CheckboxGroup
            options={filterOptions.transmissions ?? []}
            selected={transmissions}
            onChange={(v) => update({ transmissions: v })}
          />
        </FilterSection>

        <FilterSection title="Country" count={countries.length}>
          <CheckboxGroup
            options={filterOptions.countries ?? []}
            selected={countries}
            onChange={(v) => update({ countries: v })}
          />
        </FilterSection>
      </div>
    </div>
  );
}
