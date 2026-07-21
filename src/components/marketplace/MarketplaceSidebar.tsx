'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CurrencySwitcher } from '@/components/marketplace/CurrencySwitcher';
import { ContinentFilter } from '@/components/marketplace/ContinentFilter';
import { Slider } from '@/components/ui/slider';
import { placeholderMakesData, type MakeData } from '@/data/makesData';
import { placeholderBodyTypes } from '@/data/placeholderBodyTypes';
import { ChevronDown } from 'lucide-react';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'];
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT'];

export interface SidebarFilterState {
  makes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
  priceRange: [number, number];
  yearRange: [number, number];
  destinationCountry: string;
}

interface MarketplaceSidebarProps {
  filters: SidebarFilterState;
  onFilterChange: (filters: SidebarFilterState) => void;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
  activeCount,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  activeCount?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, open]);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between py-2 text-left transition-colors hover:text-[#B8B8B8] group/trigger"
      >
        <div className="flex items-center gap-1.5">
          <h3 className="font-[Oswald] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6E6E6E] group-hover/trigger:text-[#9A9A9A] transition-colors">
            {title}
          </h3>
          {activeCount !== undefined && activeCount > 0 && (
            <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#E5231B] px-1 text-[7px] font-bold text-white leading-none">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-[#3D3D3D] transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-250 ease-in-out"
        style={{
          maxHeight: open ? `${contentHeight}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="pb-2.5">{children}</div>
      </div>
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const isActive = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={cn(
              'rounded-[3px] border px-2 py-[5px] text-[9px] font-medium transition-all duration-150',
              isActive
                ? 'border-[#E5231B]/60 bg-[#E5231B]/10 text-[#FFFFFF]'
                : 'border-[#222222] bg-[#111111] text-[#7A7A7A] hover:border-[#3D3D3D] hover:text-[#B8B8B8] hover:bg-[#161616]'
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MakeItem({
  make,
  isSelected,
  onToggle,
}: {
  make: MakeData;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'group/make flex items-center gap-2 rounded-[5px] px-2 py-[6px] transition-all duration-150 w-full',
        isSelected
          ? 'bg-[#E5231B]/[0.06] border border-[#E5231B]/20'
          : 'bg-transparent border border-transparent hover:bg-[#161616]'
      )}
    >
      <img
        src={make.logo}
        alt={`${make.name} logo`}
        className={cn(
          'h-6 w-6 rounded-full object-cover transition-all duration-150',
          isSelected ? 'ring-1 ring-[#E5231B]/30' : 'group-hover/make:ring-1 group-hover/make:ring-[#2A2A2A]'
        )}
      />
      <span
        className={cn(
          'flex-1 text-left text-[9.5px] font-medium uppercase tracking-[0.08em] transition-colors duration-150',
          isSelected ? 'text-[#FFFFFF]' : 'text-[#8A8A8A] group-hover/make:text-[#D0D0D0]'
        )}
      >
        {make.name}
      </span>
      <span
        className={cn(
          'rounded-[3px] px-1.5 py-[1px] text-[8px] font-semibold tabular-nums transition-all duration-150',
          isSelected
            ? 'bg-[#E5231B]/15 text-[#E5231B]'
            : 'bg-[#0E0E0E] text-[#5A5A5A] group-hover/make:bg-[#141414] group-hover/make:text-[#7A7A7A]'
        )}
      >
        {make.count}
      </span>
    </button>
  );
}

export function MarketplaceSidebar({ filters, onFilterChange }: MarketplaceSidebarProps) {
  const {
    makes,
    bodyTypes,
    fuelTypes,
    transmissions,
    priceRange,
    yearRange,
    destinationCountry,
  } = filters;

  const sidebarRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  const update = useCallback(
    (partial: Partial<SidebarFilterState>) => {
      onFilterChange({
        makes,
        bodyTypes,
        fuelTypes,
        transmissions,
        priceRange,
        yearRange,
        destinationCountry,
        ...partial,
      });
    },
    [makes, bodyTypes, fuelTypes, transmissions, priceRange, yearRange, destinationCountry, onFilterChange]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const toggleMake = useCallback(
    (make: string) => {
      const next = makes.includes(make) ? makes.filter((m) => m !== make) : [...makes, make];
      update({ makes: next });
    },
    [makes, update]
  );

  const toggleBodyType = useCallback(
    (bt: string) => {
      const next = bodyTypes.includes(bt) ? bodyTypes.filter((b) => b !== bt) : [...bodyTypes, bt];
      update({ bodyTypes: next });
    },
    [bodyTypes, update]
  );

  const toggleFuel = useCallback(
    (f: string) => {
      const next = fuelTypes.includes(f) ? fuelTypes.filter((x) => x !== f) : [...fuelTypes, f];
      update({ fuelTypes: next });
    },
    [fuelTypes, update]
  );

  const toggleTransmission = useCallback(
    (t: string) => {
      const next = transmissions.includes(t) ? transmissions.filter((x) => x !== t) : [...transmissions, t];
      update({ transmissions: next });
    },
    [transmissions, update]
  );

  const activeFilters =
    makes.length + bodyTypes.length + fuelTypes.length + transmissions.length;

  return (
    <>
      <div ref={sentinelRef} className="h-0 w-full lg:hidden" aria-hidden="true" />
      <aside
        ref={sidebarRef}
        className={cn(
          'hidden w-[260px] shrink-0 flex-col lg:flex',
          'transition-[position,max-height,opacity] duration-300 ease-out',
          isSticky
            ? 'sticky top-[68px] max-h-[calc(100vh-84px)] overflow-y-auto scrollbar-thin'
            : 'relative'
        )}
      >
        <div className="flex flex-col gap-[3px]">
          {/* Currency */}
          <div className="rounded-[8px] border border-[#222222] bg-[#161616] px-3 py-2.5">
            <FilterSection title="Select Currency" defaultOpen={true}>
              <CurrencySwitcher variant="sidebar" />
            </FilterSection>
          </div>

          {/* Destination Country */}
          <div className="rounded-[8px] border border-[#222222] bg-[#161616] px-3 py-2.5">
            <FilterSection title="Destination Country" defaultOpen={false} activeCount={destinationCountry ? 1 : 0}>
              <ContinentFilter
                variant="sidebar"
                selectedCountry={destinationCountry}
                onCountrySelect={(code) =>
                  update({ destinationCountry: destinationCountry === code ? '' : code })
                }
              />
            </FilterSection>
          </div>

          {/* Shop By Make */}
          <div className="rounded-[8px] border border-[#222222] bg-[#161616] px-3 py-2.5">
            <FilterSection title="Shop By Make" defaultOpen={true} activeCount={makes.length}>
              <div className="flex flex-col gap-px">
                {placeholderMakesData.map((make) => (
                  <MakeItem
                    key={make.slug}
                    make={make}
                    isSelected={makes.includes(make.name)}
                    onToggle={() => toggleMake(make.name)}
                  />
                ))}
              </div>
            </FilterSection>
          </div>

          {/* Body Type + Transmission + Fuel — grouped row */}
          <div className="rounded-[8px] border border-[#222222] bg-[#161616] px-3 py-2.5">
            <FilterSection title="Body Type" defaultOpen={false} activeCount={bodyTypes.length}>
              <ChipGroup options={placeholderBodyTypes} selected={bodyTypes} onToggle={toggleBodyType} />
            </FilterSection>
            <div className="my-1 border-t border-[#222222]" />
            <FilterSection title="Transmission" defaultOpen={false} activeCount={transmissions.length}>
              <ChipGroup options={TRANSMISSIONS} selected={transmissions} onToggle={toggleTransmission} />
            </FilterSection>
            <div className="my-1 border-t border-[#222222]" />
            <FilterSection title="Fuel Type" defaultOpen={false} activeCount={fuelTypes.length}>
              <ChipGroup options={FUEL_TYPES} selected={fuelTypes} onToggle={toggleFuel} />
            </FilterSection>
          </div>

          {/* Year + Price — grouped */}
          <div className="rounded-[8px] border border-[#222222] bg-[#161616] px-3 py-2.5">
            <FilterSection
              title="Year"
              defaultOpen={false}
              activeCount={yearRange[0] !== 2000 || yearRange[1] !== 2026 ? 1 : 0}
            >
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-[9px] font-medium tabular-nums text-[#6E6E6E]">
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
            </FilterSection>
            <div className="my-1 border-t border-[#222222]" />
            <FilterSection
              title="Price Range"
              defaultOpen={false}
              activeCount={priceRange[0] !== 0 || priceRange[1] !== 100000 ? 1 : 0}
            >
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-[9px] font-medium tabular-nums text-[#6E6E6E]">
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
            </FilterSection>
          </div>

          {/* Clear Filters */}
          {activeFilters > 0 && (
            <button
              onClick={() =>
                onFilterChange({
                  makes: [],
                  bodyTypes: [],
                  fuelTypes: [],
                  transmissions: [],
                  priceRange: [0, 100000],
                  yearRange: [2000, 2026],
                  destinationCountry: '',
                })
              }
              className="mt-0.5 w-full rounded-[5px] border border-[#2A2A2A] bg-[#111111] py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#6E6E6E] transition-all duration-150 hover:border-[#E5231B]/40 hover:bg-[#E5231B]/[0.06] hover:text-[#E5231B]"
            >
              Clear All Filters ({activeFilters})
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
