'use client';

import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, BookmarkPlus, RotateCcw } from 'lucide-react';

import { SearchBar } from '@/components/marketplace/SearchBar';
import { FilterSidebar, type FilterState } from '@/components/marketplace/FilterSidebar';
import { MobileFilterDrawer } from '@/components/marketplace/MobileFilterDrawer';
import { ActiveFilters } from '@/components/marketplace/ActiveFilters';
import { SortSelect } from '@/components/marketplace/SortSelect';
import { VehicleGrid } from '@/components/marketplace/VehicleGrid';
import { Pagination } from '@/components/marketplace/Pagination';
import { CompareBar } from '@/components/marketplace/CompareBar';
import { type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { placeholderVehicles } from '@/data/placeholderVehicles';
import { SectionWrapper } from '@/components/layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PAGE_SIZE = 12;

function applyFilters(
  vehicles: VehicleCardData[],
  query: string,
  filters: Partial<FilterState>,
): VehicleCardData[] {
  return vehicles.filter((v) => {
    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      const hit =
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        String(v.year).includes(q) ||
        v.bodyType.toLowerCase().includes(q) ||
        v.fuelType.toLowerCase().includes(q);
      if (!hit) return false;
    }
    // Makes
    if (filters.makes?.length && !filters.makes.includes(v.make)) return false;
    // Body types
    if (filters.bodyTypes?.length && !filters.bodyTypes.includes(v.bodyType)) return false;
    // Fuel types
    if (filters.fuelTypes?.length && !filters.fuelTypes.includes(v.fuelType)) return false;
    // Transmissions
    if (filters.transmissions?.length && !filters.transmissions.includes(v.transmission)) return false;
    // Price range
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      if (v.price < min || v.price > max) return false;
    }
    // Year range
    if (filters.yearRange) {
      const [minY, maxY] = filters.yearRange;
      if (v.year < minY || v.year > maxY) return false;
    }
    // Max mileage
    if (filters.mileageMax !== undefined && v.mileage > filters.mileageMax) return false;
    return true;
  });
}

function applySort(vehicles: VehicleCardData[], sort: string): VehicleCardData[] {
  const result = [...vehicles];
  switch (sort) {
    case 'price-asc':   return result.sort((a, b) => a.price - b.price);
    case 'price-desc':  return result.sort((a, b) => b.price - a.price);
    case 'year-desc':   return result.sort((a, b) => b.year - a.year);
    case 'year-asc':    return result.sort((a, b) => a.year - b.year);
    case 'mileage-asc': return result.sort((a, b) => a.mileage - b.mileage);
    default: return result;
  }
}

// â”€â”€â”€ Loading skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col">
          <div className="aspect-[4/3] bg-muted/60" />
          <div className="p-4 sm:p-5 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-3 w-12 rounded bg-muted" />
            </div>
            <div className="h-5 w-3/4 rounded bg-muted mb-3" />
            <div className="h-6 w-1/3 rounded bg-muted mb-4" />
            
            <div className="mt-auto grid grid-cols-2 gap-y-3 gap-x-2 border-t border-border/50 pt-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-3.5 w-full rounded bg-muted/60" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// â”€â”€â”€ Empty State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/10 text-center p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm border">
        <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h3 className="font-bold text-xl tracking-tight">No vehicles found</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We couldn&apos;t find any vehicles matching your current search criteria. Try adjusting your filters or expanding your search.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        <Button onClick={onReset} className="font-medium shadow-sm">
          Clear all filters
        </Button>
        <Button variant="outline" className="bg-background">
          Save this search
        </Button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function VehiclesPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Partial<FilterState>>({});
  const [sort, setSort] = useState('price-asc');
  const [page, setPage] = useState(1);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [loading] = useState(false); // set to true to preview skeleton

  // â”€â”€ Derived data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = useMemo(
    () => applySort(applyFilters(placeholderVehicles, query, filters), sort),
    [query, filters, sort],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  
  const startCount = filtered.length > 0 ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const endCount = Math.min(safePage * PAGE_SIZE, filtered.length);

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({});
    setQuery('');
    setPage(1);
  };

  const handleRemoveFilter = (key: keyof FilterState, value?: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (Array.isArray(next[key]) && value) {
        (next[key] as string[]) = (next[key] as string[]).filter((v) => v !== value);
        if ((next[key] as string[]).length === 0) delete next[key];
      } else {
        delete next[key];
      }
      return next;
    });
    setPage(1);
  };

  const handleSearchSubmit = (v: string) => {
    setQuery(v);
    setPage(1);
  };

  const handleCompareToggle = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || query.trim().length > 0;

  return (
    <>
      <SectionWrapper className="space-y-0 pb-4 pt-6 md:pt-10">
        {/* â”€â”€ Page Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Marketplace</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
              Browse {placeholderVehicles.length.toLocaleString()}+ premium inspected vehicles available for global export.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button variant="outline" className="bg-background shadow-sm hover:bg-muted font-medium text-sm">
              <BookmarkPlus className="mr-2 h-4 w-4" /> Save Search
            </Button>
          </div>
        </div>

        {/* â”€â”€ Search bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="max-w-3xl mb-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearchSubmit}
            placeholder="Search by make, model, chassis, or keyword..."
            className="shadow-sm"
          />
        </div>

        {/* â”€â”€ Active filter chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {hasActiveFilters && (
          <ActiveFilters
            filters={filters}
            onRemove={handleRemoveFilter}
            onClearAll={handleReset}
            className="mb-4"
          />
        )}
      </SectionWrapper>

      <SectionWrapper className="pt-0 pb-20">
        <div className="flex flex-col gap-8 md:flex-row md:items-start relative">

          {/* â”€â”€ Desktop Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <aside className="hidden md:block w-64 xl:w-72 shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-hidden rounded-[10px] border border-iron bg-carbon p-4">
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
            />
          </aside>

          {/* â”€â”€ Main content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex-1 min-w-0 flex flex-col">

            {/* Toolbar: mobile filter + sort + result count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/50 sticky top-0 z-20 bg-background/95 backdrop-blur py-2">
              <div className="flex items-center gap-3">
                {/* Mobile filter trigger */}
                <div className="md:hidden">
                  <MobileFilterDrawer />
                </div>
                
                <div className="text-sm">
                  {loading ? (
                    <span className="text-muted-foreground">Searching vehicles...</span>
                  ) : (
                    <>
                      <span className="text-muted-foreground">Showing </span>
                      <span className="font-medium text-foreground">{startCount}â€“{endCount}</span>
                      <span className="text-muted-foreground"> of </span>
                      <span className="font-semibold text-foreground">{filtered.length}</span>
                      <span className="text-muted-foreground"> Vehicles</span>
                    </>
                  )}
                  {query && !loading && (
                    <span className="ml-2 hidden sm:inline-block">
                      for <Badge variant="secondary" className="ml-1 text-xs font-normal">{query}</Badge>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleReset}
                    className="text-muted-foreground hover:text-foreground hidden sm:flex"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
                <SortSelect onChange={(v) => { setSort(v); setPage(1); }} className="w-[180px] sm:w-[220px]" />
              </div>
            </div>

            {/* Vehicle grid / loading / empty */}
            {loading ? (
              <LoadingSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState onReset={handleReset} />
            ) : (
              <VehicleGrid
                vehicles={paginated}
                className="flex-1"
              />
            )}

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border/50">
                <Pagination
                  totalPages={totalPages}
                  currentPage={safePage}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>
      </SectionWrapper>

      {/* â”€â”€ Sticky compare bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <CompareBar
        selectedIds={compareIds}
        onRemove={handleCompareToggle}
        onCompare={() => {
          window.location.href = `/compare?ids=${compareIds.join(',')}`;
        }}
        className="z-50 border-t-2 border-primary"
      />
    </>
  );
}
