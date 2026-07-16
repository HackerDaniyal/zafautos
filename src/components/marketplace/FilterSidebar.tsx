'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RotateCcw } from 'lucide-react';

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

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
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
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">{label}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`filter-${label}-${option}`}
              checked={selected.includes(option)}
              onCheckedChange={() => toggle(option)}
            />
            <Label htmlFor={`filter-${label}-${option}`} className="font-normal cursor-pointer text-sm">
              {option}
            </Label>
          </div>
        ))}
      </div>
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

  const update = (partial: Partial<FilterState>) => {
    onFilterChange?.({ makes, bodyTypes, fuelTypes, transmissions, priceRange, yearRange, mileageMax, ...partial });
  };

  return (
    <aside className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset All
        </Button>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Price</h3>
          <span className="text-xs text-muted-foreground">
            ${priceRange[0].toLocaleString()} – ${priceRange[1].toLocaleString()}
          </span>
        </div>
        <Slider
          min={0}
          max={100000}
          step={500}
          value={priceRange}
          onValueChange={(v: number[]) => update({ priceRange: v as [number, number] })}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Year Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Year</h3>
          <span className="text-xs text-muted-foreground">
            {yearRange[0]} – {yearRange[1]}
          </span>
        </div>
        <Slider
          min={2000}
          max={2026}
          step={1}
          value={yearRange}
          onValueChange={(v: number[]) => update({ yearRange: v as [number, number] })}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Mileage */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Max Mileage</h3>
          <span className="text-xs text-muted-foreground">{mileageMax.toLocaleString()} km</span>
        </div>
        <Slider
          min={0}
          max={200000}
          step={5000}
          value={[mileageMax]}
          onValueChange={([v]: number[]) => update({ mileageMax: v })}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Make */}
      <CheckboxGroup
        label="Make"
        options={MAKES}
        selected={makes}
        onChange={(v) => update({ makes: v })}
      />

      <Separator />

      {/* Body Type */}
      <CheckboxGroup
        label="Body Type"
        options={BODY_TYPES}
        selected={bodyTypes}
        onChange={(v) => update({ bodyTypes: v })}
      />

      <Separator />

      {/* Fuel Type */}
      <CheckboxGroup
        label="Fuel Type"
        options={FUEL_TYPES}
        selected={fuelTypes}
        onChange={(v) => update({ fuelTypes: v })}
      />

      <Separator />

      {/* Transmission */}
      <CheckboxGroup
        label="Transmission"
        options={TRANSMISSIONS}
        selected={transmissions}
        onChange={(v) => update({ transmissions: v })}
      />
    </aside>
  );
}
