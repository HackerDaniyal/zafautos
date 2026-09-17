'use client';

import React, { useState, useCallback, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, BookmarkPlus, BookmarkCheck, RotateCcw, Loader2 } from 'lucide-react';

import { SearchBar } from '@/components/marketplace/SearchBar';
import { FilterSidebar, type FilterState } from '@/components/marketplace/FilterSidebar';
import { MobileFilterDrawer } from '@/components/marketplace/MobileFilterDrawer';
import { ActiveFilters } from '@/components/marketplace/ActiveFilters';
import { SortSelect } from '@/components/marketplace/SortSelect';
import { VehicleGrid } from '@/components/marketplace/VehicleGrid';
import { Pagination } from '@/components/marketplace/Pagination';
import { ContinentFilter } from '@/components/marketplace/ContinentFilter';
import { type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { SectionWrapper } from '@/components/layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPublicVehicles, type PublicVehicleFilters } from '@/server/actions/publicVehicleActions';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import type { HomepageContinent, HomepageCurrency } from '@/lib/homepage-data';

type FilterOptions = {
  makes: Array<{ id: string; name: string; count: number }>;
  models: Array<{ id: string; name: string; count: number }>;
  bodyTypes: Array<{ id: string; name: string; count: number }>;
  fuelTypes: Array<{ id: string; name: string; count: number }>;
  transmissions: Array<{ id: string; name: string; count: number }>;
  countries: Array<{ id: string; name: string; count: number }>;
};

interface VehiclesPageClientProps {
  initialVehicles: VehicleCardData[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialFilters: FilterOptions;
  initialSort: string;
  initialSearch: string;
  initialQueryParams: Record<string, string | undefined>;
  initialContinents: HomepageContinent[];
  initialCurrencies?: HomepageCurrency[];
  initialExchangeRates?: Record<string, number>;
}

export function VehiclesPageClient({
  initialVehicles,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialFilters: filterOptions,
  initialSort,
  initialSearch,
  initialQueryParams,
  initialContinents,
  initialCurrencies = [],
  initialExchangeRates = { USD: 1 },
}: VehiclesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local filter state (will sync to URL)
  const [query, setQuery] = useState(initialSearch);
  const [filters, setFilters] = useState<Partial<FilterState>>({
    makes: initialQueryParams.make ? decodeURIComponent(initialQueryParams.make).split(',') : [],
    models: initialQueryParams.model ? decodeURIComponent(initialQueryParams.model).split(',') : [],
    bodyTypes: initialQueryParams.bodyType ? decodeURIComponent(initialQueryParams.bodyType).split(',') : [],
    fuelTypes: initialQueryParams.fuel ? decodeURIComponent(initialQueryParams.fuel).split(',') : [],
    transmissions: initialQueryParams.trans ? decodeURIComponent(initialQueryParams.trans).split(',') : [],
    countries: initialQueryParams.country ? decodeURIComponent(initialQueryParams.country).split(',') : [],
    priceRange: [
      initialQueryParams.priceMin ? parseInt(initialQueryParams.priceMin) || 0 : 0,
      initialQueryParams.priceMax ? parseInt(initialQueryParams.priceMax) || 100000 : 100000,
    ],
    yearRange: [
      initialQueryParams.yearMin ? parseInt(initialQueryParams.yearMin) || 2000 : 2000,
      initialQueryParams.yearMax ? parseInt(initialQueryParams.yearMax) || 2026 : 2026,
    ],
    mileageMax: initialQueryParams.mileageMax ? parseInt(initialQueryParams.mileageMax) || 200000 : 200000,
  });
  const [destinationCountry, setDestinationCountry] = useState(
    initialQueryParams.destinationCountry ? decodeURIComponent(initialQueryParams.destinationCountry) : ''
  );
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Build URL search params from current state
  const buildParams = useCallback(
    (overrides: Partial<PublicVehicleFilters> & { destinationCountry?: string } = {}) => {
      const p = new URLSearchParams();

      const q = overrides.search !== undefined ? overrides.search : query;
      if (q) p.set('q', q);

      const makes = overrides.makes !== undefined ? overrides.makes : filters.makes;
      if (makes && makes.length > 0) p.set('make', makes.join(','));

      const models = overrides.models !== undefined ? overrides.models : filters.models;
      if (models && models.length > 0) p.set('model', models.join(','));

      const bodyTypes = overrides.bodyTypes !== undefined ? overrides.bodyTypes : filters.bodyTypes;
      if (bodyTypes && bodyTypes.length > 0) p.set('bodyType', bodyTypes.join(','));

      const fuelTypes = overrides.fuelTypes !== undefined ? overrides.fuelTypes : filters.fuelTypes;
      if (fuelTypes && fuelTypes.length > 0) p.set('fuel', fuelTypes.join(','));

      const trans = overrides.transmissions !== undefined ? overrides.transmissions : filters.transmissions;
      if (trans && trans.length > 0) p.set('trans', trans.join(','));

      const countries = overrides.countries !== undefined ? overrides.countries : filters.countries;
      if (countries && countries.length > 0) p.set('country', countries.join(','));

      const s = overrides.sort !== undefined ? overrides.sort : sort;
      if (s && s !== 'newest') p.set('sort', s);

      const pg = overrides.page !== undefined ? overrides.page : page;
      if (pg && pg > 1) p.set('page', String(pg));

      const [pMin, pMax] = overrides.priceMin !== undefined
        ? [overrides.priceMin, overrides.priceMax]
        : filters.priceRange ?? [0, 100000];
      if (pMin && pMin > 0) p.set('priceMin', String(pMin));
      if (pMax && pMax < 100000) p.set('priceMax', String(pMax));

      const [yMin, yMax] = overrides.yearMin !== undefined
        ? [overrides.yearMin, overrides.yearMax]
        : filters.yearRange ?? [2000, 2026];
      if (yMin && yMin > 2000) p.set('yearMin', String(yMin));
      if (yMax && yMax < 2026) p.set('yearMax', String(yMax));

      const mm = overrides.mileageMax !== undefined ? overrides.mileageMax : filters.mileageMax;
      if (mm && mm < 200000) p.set('mileageMax', String(mm));

      const dc = overrides.destinationCountry !== undefined ? overrides.destinationCountry : destinationCountry;
      if (dc) p.set('destinationCountry', dc);

      return p;
    },
    [query, filters, sort, page, destinationCountry],
  );

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('zaf_saved_searches');
      if (!saved) { setIsSaved(false); return; }
      const searches: Array<{ url: string }> = JSON.parse(saved);
      const currentUrl = `${pathname}?${buildParams().toString()}`;
      setIsSaved(searches.some((s) => s.url === currentUrl));
    } catch {
      setIsSaved(false);
    }
  }, [query, filters, sort, destinationCountry, pathname, buildParams]);

  const handleSaveSearch = () => {
    try {
      const saved = localStorage.getItem('zaf_saved_searches');
      const searches: Array<{ url: string; label: string; date: string }> = saved ? JSON.parse(saved) : [];
      const currentUrl = `${pathname}?${buildParams().toString()}`;
      const label = [query, filters.makes?.join(', '), filters.bodyTypes?.join(', ')].filter(Boolean).join(' · ') || 'All vehicles';

      if (isSaved) {
        const updated = searches.filter((s) => s.url !== currentUrl);
        localStorage.setItem('zaf_saved_searches', JSON.stringify(updated));
        setIsSaved(false);
      } else {
        searches.unshift({ url: currentUrl, label, date: new Date().toISOString() });
        localStorage.setItem('zaf_saved_searches', JSON.stringify(searches.slice(0, 10)));
        setIsSaved(true);
      }
    } catch (e) {
      console.error('Failed to save search', e);
    }
  };

  // Navigate to new URL (triggers server refetch via searchParams)
  const navigate = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      startTransition(() => {
        router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
      });
    },
    [router, pathname],
  );

  const handleFilterChange = (partial: Partial<FilterState>) => {
    const next = { ...filters, ...partial };
    // Make→Model dependency: if makes changed, clear models that don't belong to new makes
    if (partial.makes !== undefined && partial.makes !== filters.makes) {
      next.models = [];
    }
    setFilters(next);
    setPage(1);
    // Sync to URL immediately
    const params = buildParams({
      makes: next.makes,
      models: next.models,
      bodyTypes: next.bodyTypes,
      fuelTypes: next.fuelTypes,
      transmissions: next.transmissions,
      countries: next.countries,
      priceMin: next.priceRange?.[0],
      priceMax: next.priceRange?.[1],
      yearMin: next.yearRange?.[0],
      yearMax: next.yearRange?.[1],
      mileageMax: next.mileageMax,
      page: 1,
      sort,
    });
    navigate(params);
  };

  const handleReset = () => {
    setFilters({});
    setQuery('');
    setDestinationCountry('');
    setPage(1);
    setSort('newest');
    navigate(new URLSearchParams());
  };

  const handleRemoveFilter = (key: keyof FilterState, value?: string) => {
    const next = { ...filters };
    if (Array.isArray(next[key]) && value) {
      (next[key] as string[]) = (next[key] as string[]).filter((v) => v !== value);
      if ((next[key] as string[]).length === 0) delete next[key];
    } else {
      delete next[key];
    }
    // Make→Model dependency: if removing a make, also remove models not belonging to remaining makes
    if (key === 'makes' && next.models?.length) {
      next.models = [];
    }
    setFilters(next);
    setPage(1);
    const params = buildParams({
      makes: next.makes,
      models: next.models,
      bodyTypes: next.bodyTypes,
      fuelTypes: next.fuelTypes,
      transmissions: next.transmissions,
      countries: next.countries,
      priceMin: next.priceRange?.[0],
      priceMax: next.priceRange?.[1],
      yearMin: next.yearRange?.[0],
      yearMax: next.yearRange?.[1],
      mileageMax: next.mileageMax,
      page: 1,
      sort,
    });
    navigate(params);
  };

  const handleSearchSubmit = (v: string) => {
    setQuery(v);
    setPage(1);
    const params = buildParams({ search: v, page: 1, sort });
    navigate(params);
  };

  const handleSortChange = (v: string) => {
    setSort(v);
    setPage(1);
    const params = buildParams({ sort: v, page: 1 });
    navigate(params);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    const params = buildParams({ page: p });
    navigate(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompareToggle = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  };

  const handleDestinationCountrySelect = (code: string) => {
    const newCountry = destinationCountry === code ? '' : code;
    setDestinationCountry(newCountry);
    setPage(1);
    const params = buildParams({ destinationCountry: newCountry, page: 1 });
    navigate(params);
  };

  const hasActiveFilters =
    (filters.makes?.length ?? 0) > 0 ||
    (filters.models?.length ?? 0) > 0 ||
    (filters.bodyTypes?.length ?? 0) > 0 ||
    (filters.fuelTypes?.length ?? 0) > 0 ||
    (filters.transmissions?.length ?? 0) > 0 ||
    (filters.countries?.length ?? 0) > 0 ||
    (filters.priceRange?.[0] ?? 0) > 0 ||
    (filters.priceRange?.[1] ?? 100000) < 100000 ||
    (filters.yearRange?.[0] ?? 2000) > 2000 ||
    (filters.yearRange?.[1] ?? 2026) < 2026 ||
    (filters.mileageMax ?? 200000) < 200000 ||
    destinationCountry.trim().length > 0 ||
    query.trim().length > 0;

  const startCount = initialVehicles.length > 0 ? (initialPage - 1) * 12 + 1 : 0;
  const endCount = Math.min(initialPage * 12, initialTotal);

  return (
    <CurrencyProvider currencies={initialCurrencies} rates={initialExchangeRates}>
    <>
      <SectionWrapper className="space-y-0 pb-4 pt-6 md:pt-10">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Marketplace</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
              Browse {initialTotal.toLocaleString()}+ premium inspected vehicles available for global export.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleSaveSearch}
              className={`border-gray-200 shadow-sm font-medium text-sm transition-all duration-200 ${
                isSaved
                  ? 'bg-[#E5231B]/10 border-[#E5231B]/30 text-[#E5231B] hover:bg-[#E5231B]/20'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="mr-2 h-4 w-4" /> Saved
                </>
              ) : (
                <>
                  <BookmarkPlus className="mr-2 h-4 w-4" /> Save Search
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="max-w-3xl mb-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearchSubmit}
            placeholder="Search by make, model, VIN, stock number..."
            className="shadow-sm"
          />
        </div>

        {/* Active filter chips */}
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
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 xl:w-72 shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-hidden rounded-[10px] border border-gray-200 bg-white p-4">
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
              filterOptions={filterOptions}
            />
            {initialContinents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-3">Destination Country</h3>
                {destinationCountry && (
                  <button
                    onClick={() => handleDestinationCountrySelect(destinationCountry)}
                    className="text-[11px] text-[#E5231B] hover:underline mb-2"
                  >
                    Clear
                  </button>
                )}
                <ContinentFilter
                  variant="sidebar"
                  selectedCountry={destinationCountry}
                  onCountrySelect={handleDestinationCountrySelect}
                  continents={initialContinents}
                />
              </div>
            )}
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/50 sticky top-0 z-20 bg-background/95 backdrop-blur py-2">
              <div className="flex items-center gap-3">
                {/* Mobile filter trigger */}
                <div className="md:hidden">
                  <MobileFilterDrawer
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleReset}
                    filterOptions={filterOptions}
                  />
                </div>

                <div className="text-sm">
                  {isPending ? (
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    <>
                      <span className="text-muted-foreground">Showing </span>
                      <span className="font-medium text-foreground">{startCount}–{endCount}</span>
                      <span className="text-muted-foreground"> of </span>
                      <span className="font-semibold text-foreground">{initialTotal}</span>
                      <span className="text-muted-foreground"> Vehicles</span>
                    </>
                  )}
                  {query && !isPending && (
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
                <SortSelect
                  value={sort}
                  onChange={handleSortChange}
                  className="w-[180px] sm:w-[220px]"
                />
              </div>
            </div>

            {/* Vehicle grid / loading / empty */}
            {isPending ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col">
                    <div className="aspect-[4/3] bg-muted/60" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-6 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : initialVehicles.length === 0 ? (
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
                <Button onClick={handleReset} className="font-medium shadow-sm mt-4">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <VehicleGrid vehicles={initialVehicles} className="flex-1" onClearFilters={handleReset} />
            )}

            {/* Pagination */}
            {!isPending && initialTotalPages > 1 && (
              <div className="mt-10 pt-6 border-t border-border/50">
                <Pagination
                  totalPages={initialTotalPages}
                  currentPage={initialPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </SectionWrapper>
    </>
    </CurrencyProvider>
  );
}
