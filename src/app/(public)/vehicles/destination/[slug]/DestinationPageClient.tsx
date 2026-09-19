'use client';

import React, { useState, useCallback, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, SlidersHorizontal, RotateCcw, Loader2 } from 'lucide-react';

import { SearchBar } from '@/components/marketplace/SearchBar';
import { FilterSidebar, type FilterState } from '@/components/marketplace/FilterSidebar';
import { MobileFilterDrawer } from '@/components/marketplace/MobileFilterDrawer';
import { ActiveFilters } from '@/components/marketplace/ActiveFilters';
import { SortSelect } from '@/components/marketplace/SortSelect';
import { VehicleGrid } from '@/components/marketplace/VehicleGrid';
import { Pagination } from '@/components/marketplace/Pagination';
import { CurrencySwitcher } from '@/components/marketplace/CurrencySwitcher';
import { type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { SectionWrapper } from '@/components/layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPublicVehicles, type PublicVehicleFilters } from '@/server/actions/publicVehicleActions';
import { getCountryFlagPath } from '@/lib/country-flags';

type FilterOptions = {
  makes: Array<{ id: string; name: string; count: number }>;
  models: Array<{ id: string; name: string; count: number }>;
  bodyTypes: Array<{ id: string; name: string; count: number }>;
  fuelTypes: Array<{ id: string; name: string; count: number }>;
  transmissions: Array<{ id: string; name: string; count: number }>;
  countries: Array<{ id: string; name: string; count: number }>;
};

interface DestinationPageClientProps {
  countryName: string;
  countrySlug: string;
  countryId: string;
  flagImage: string | null;
  initialVehicles: VehicleCardData[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialFilters: FilterOptions;
  initialSort: string;
  initialSearch: string;
  initialQueryParams: Record<string, string | undefined>;
}

export function DestinationPageClient({
  countryName,
  countrySlug,
  countryId,
  flagImage,
  initialVehicles,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialFilters: filterOptions,
  initialSort,
  initialSearch,
  initialQueryParams,
}: DestinationPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);

  const resolvedFlag = flagImage || getCountryFlagPath(countryName, countrySlug);

  const buildParams = useCallback(
    (overrides: Partial<PublicVehicleFilters> = {}) => {
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

      return p;
    },
    [query, filters, sort, page],
  );

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
    if (partial.makes !== undefined && partial.makes !== filters.makes) {
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

  const handleReset = () => {
    setFilters({});
    setQuery('');
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
    query.trim().length > 0;

  const startCount = initialVehicles.length > 0 ? (initialPage - 1) * 12 + 1 : 0;
  const endCount = Math.min(initialPage * 12, initialTotal);

  return (
    <>
      <SectionWrapper className="space-y-0 pb-4 pt-6 md:pt-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
          <Link href="/vehicles" className="hover:text-gray-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Inventory
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-900">{countryName}</span>
        </nav>

        {/* Country Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-4">
            {resolvedFlag ? (
              <img
                src={resolvedFlag}
                alt={`${countryName} flag`}
                width={56}
                height={56}
                className="rounded-full object-cover shadow-sm ring-1 ring-gray-200"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-gray-200">
                <span className="text-2xl">{countryName.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Japanese Cars for {countryName}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                Browse Japanese vehicles available for export to {countryName}.
              </p>
            </div>
          </div>
          <div className="md:ml-auto">
            <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
              {initialTotal.toLocaleString()} Vehicle{initialTotal !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Search bar */}
        <div className="max-w-3xl mb-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearchSubmit}
            placeholder={`Search vehicles for ${countryName}...`}
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
            <div className="mt-4 pt-4 border-t border-gray-200">
              <CurrencySwitcher variant="sidebar" />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/50 sticky top-0 z-20 bg-background/95 backdrop-blur py-2">
              <div className="flex items-center gap-3">
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
                  {resolvedFlag ? (
                    <img src={resolvedFlag} alt="" width={40} height={40} className="rounded-full" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">{countryName.charAt(0)}</span>
                  )}
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="font-bold text-xl tracking-tight">No vehicles available</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No vehicles are currently available for export to {countryName}. Try browsing our full inventory.
                  </p>
                </div>
                <Link href="/vehicles" className="mt-4">
                  <Button className="font-medium shadow-sm">
                    Browse All Vehicles
                  </Button>
                </Link>
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
  );
}
