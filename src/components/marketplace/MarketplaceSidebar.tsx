'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MakeLogo } from '@/components/admin/vehicles/entity-visuals';
import type { HomepageMake } from '@/lib/homepage-data';

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
  makes?: HomepageMake[];
}

function MakeItem({
  make,
  onNavigate,
}: {
  make: { name: string; slug: string; logoUrl: string | null; count: number };
  onNavigate: (slug: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(make.slug)}
      className={cn(
        'group/make flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition-all duration-150 w-full',
        'hover:border-[#E5231B]/40 hover:bg-red-50'
      )}
    >
      <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
        <MakeLogo name={make.name} url={make.logoUrl} className="h-8 w-8" />
      </div>
      <span className="flex-1 text-left text-xs font-bold uppercase tracking-wide text-gray-800 group-hover/make:text-[#E5231B] transition-colors">
        {make.name}
      </span>
      <span className="rounded-full bg-gray-100 text-gray-600 px-2.5 py-0.5 text-[10px] font-bold tabular-nums shrink-0 group-hover/make:bg-[#E5231B] group-hover/make:text-white transition-colors">
        {make.count}
      </span>
    </button>
  );
}

export function MarketplaceSidebar({ filters, onFilterChange, makes }: MarketplaceSidebarProps) {
  const router = useRouter();
  const {
    makes: selectedMakes,
    destinationCountry,
  } = filters;

  const navigateToMake = useCallback(
    (slug: string) => {
      router.push(`/vehicles?make=${encodeURIComponent(slug)}`);
    },
    [router],
  );

  const activeFilters = selectedMakes.length + (destinationCountry ? 1 : 0);

  const displayMakes = makes ?? [];

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col lg:flex">
        <div className="flex flex-col gap-[3px]">
          {/* Shop By Make */}
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Shop By Make</h3>
            <div className="flex flex-col gap-1">
              {displayMakes.map((make) => (
                <MakeItem
                  key={make.slug}
                  make={make}
                  onNavigate={navigateToMake}
                />
              ))}
            </div>
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
              className="mt-0.5 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 text-xs font-semibold text-gray-600 transition-all duration-150 hover:border-[#E5231B]/40 hover:bg-red-50 hover:text-[#E5231B]"
            >
              Clear All Filters ({activeFilters})
            </button>
          )}
        </div>
      </aside>
  );
}
