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
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold text-gray-800">{title}</h3>
          {count !== undefined && count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E5231B] px-1.5 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform duration-200',
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
            'rounded-md border px-3 py-1.5 text-[12px] font-medium transition-all duration-150',
            selected.includes(option.name)
              ? 'border-[#E5231B] bg-[#E5231B]/10 text-[#E5231B]'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
          )}
        >
          {option.name}
          {option.count > 0 && (
            <span className="ml-1 text-[10px] text-gray-400">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

function PillGroup<T extends string | number>({
  options,
  activeValue,
  onSelect,
}: {
  options: Array<{ label: string; value: T }>;
  activeValue: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isActive = activeValue === option.value;
        return (
          <button
            key={option.label}
            onClick={() => onSelect(option.value)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-[12px] font-medium transition-all duration-150',
              isActive
                ? 'border-[#E5231B] bg-[#E5231B] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
            )}
          >
            {option.label}
          </button>
        );
      })}
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
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-gray-900">Filters</h2>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E5231B] px-1.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 gap-1.5 px-2 text-[12px] font-medium text-gray-500 hover:text-[#E5231B] hover:bg-transparent"
          >
            <RotateCcw className="h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>

      {/* Scrollable filter sections */}
      <div className="flex-1 overflow-y-auto -mr-2 pr-2 scrollbar-thin">
        {/* Price */}
        <FilterSection title="Price">
          <PillGroup
            activeValue={`${priceRange[0]}-${priceRange[1]}`}
            onSelect={(val) => {
              const [min, max] = val.split('-').map(Number);
              update({ priceRange: [min, max] });
            }}
            options={[
              { label: 'Any', value: '0-100000' },
              { label: 'Under $5K', value: '0-5000' },
              { label: '$5K–$10K', value: '5000-10000' },
              { label: '$10K–$20K', value: '10000-20000' },
              { label: '$20K–$30K', value: '20000-30000' },
              { label: '$30K–$50K', value: '30000-50000' },
              { label: '$50K+', value: '50000-100000' },
            ]}
          />
        </FilterSection>

        {/* Year */}
        <FilterSection title="Year">
          <PillGroup
            activeValue={`${yearRange[0]}-${yearRange[1]}`}
            onSelect={(val) => {
              const [min, max] = val.split('-').map(Number);
              update({ yearRange: [min, max] });
            }}
            options={[
              { label: 'Any', value: '2000-2026' },
              { label: '2024+', value: '2024-2026' },
              { label: '2020–2024', value: '2020-2024' },
              { label: '2015–2020', value: '2015-2020' },
              { label: '2010–2015', value: '2010-2015' },
              { label: 'Before 2010', value: '2000-2010' },
            ]}
          />
        </FilterSection>

        {/* Max Mileage */}
        <FilterSection title="Max Mileage">
          <PillGroup
            activeValue={mileageMax}
            onSelect={(val) => update({ mileageMax: val })}
            options={[
              { label: 'Any', value: 200000 },
              { label: '50K km', value: 50000 },
              { label: '100K km', value: 100000 },
              { label: '150K km', value: 150000 },
              { label: '200K km', value: 200000 },
            ]}
          />
        </FilterSection>

        {/* Make */}
        <FilterSection title="Make" count={makes.length}>
          <CheckboxGroup
            options={filterOptions.makes ?? []}
            selected={makes}
            onChange={(v) => update({ makes: v, models: [] })}
          />
        </FilterSection>

        {/* Model */}
        <FilterSection title="Model" count={models.length}>
          <CheckboxGroup
            options={filterOptions.models ?? []}
            selected={models}
            onChange={(v) => update({ models: v })}
          />
        </FilterSection>

        {/* Body Type */}
        <FilterSection title="Body Type" count={bodyTypes.length}>
          <CheckboxGroup
            options={filterOptions.bodyTypes ?? []}
            selected={bodyTypes}
            onChange={(v) => update({ bodyTypes: v })}
          />
        </FilterSection>

        {/* Fuel Type */}
        <FilterSection title="Fuel Type" count={fuelTypes.length}>
          <CheckboxGroup
            options={filterOptions.fuelTypes ?? []}
            selected={fuelTypes}
            onChange={(v) => update({ fuelTypes: v })}
          />
        </FilterSection>

        {/* Transmission */}
        <FilterSection title="Transmission" count={transmissions.length}>
          <CheckboxGroup
            options={filterOptions.transmissions ?? []}
            selected={transmissions}
            onChange={(v) => update({ transmissions: v })}
          />
        </FilterSection>

        {/* Country */}
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
