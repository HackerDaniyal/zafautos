import { Suspense } from 'react';
import { Metadata } from 'next';
import { VehiclesPageClient } from './VehiclesPageClient';
import { getPublicVehicles, type PublicVehicleFilters } from '@/server/actions/publicVehicleActions';
import { fetchHomepageContinents, type HomepageContinent } from '@/lib/homepage-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zafautos.com';

async function getCurrencyData() {
  try {
    const { currencies: currenciesTable } = await import('@/server/db/schema');
    const { db } = await import('@/server/db/client');
    const { eq } = await import('drizzle-orm');
    const rows = await db.select().from(currenciesTable).where(eq(currenciesTable.isActive, true));
    const exchangeRates: Record<string, number> = { USD: 1 };
    const list = rows.map((r) => {
      exchangeRates[r.code] = Number(r.exchangeRate) || 1;
      return { code: r.code, symbol: r.symbol ?? r.code, name: r.name };
    });
    return { currencies: list, exchangeRates };
  } catch {
    return { currencies: [], exchangeRates: { USD: 1 } };
  }
}

function parseArrayParam(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const decoded = decodeURIComponent(value);
  const items = decoded.split(',').map((s) => s.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function buildTitle(params: {
  q?: string;
  make?: string;
  model?: string;
  bodyType?: string;
}) {
  const parts: string[] = [];
  if (params.q) parts.push(params.q);
  if (params.make) parts.push(decodeURIComponent(params.make));
  if (params.model) parts.push(decodeURIComponent(params.model));
  if (params.bodyType) parts.push(decodeURIComponent(params.bodyType));
  if (parts.length === 0) return 'Marketplace | Premium Japanese Vehicles | ZafAutos';
  return `${parts.join(' ')} Vehicles | ZafAutos`;
}

function buildDescription(params: {
  q?: string;
  make?: string;
  model?: string;
  bodyType?: string;
}) {
  const parts: string[] = [];
  if (params.make) parts.push(decodeURIComponent(params.make));
  if (params.model) parts.push(decodeURIComponent(params.model));
  if (params.bodyType) parts.push(decodeURIComponent(params.bodyType));
  if (params.q) parts.push(`matching "${decodeURIComponent(params.q)}"`);
  if (parts.length === 0) {
    return 'Browse our inventory of premium inspected Japanese vehicles available for global export. Filter by make, model, body type, fuel, and more.';
  }
  return `Browse ${parts.join(' ')} vehicles available for global export from Japan. Premium inspected inventory with detailed specifications.`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }): Promise<Metadata> {
  const params = await searchParams;
  const title = buildTitle(params);
  const description = buildDescription(params);

  // Build canonical URL without page/sort params
  const canonicalParams = new URLSearchParams();
  if (params.make) canonicalParams.set('make', params.make);
  if (params.model) canonicalParams.set('model', params.model);
  if (params.bodyType) canonicalParams.set('bodyType', params.bodyType);
  if (params.fuel) canonicalParams.set('fuel', params.fuel);
  if (params.trans) canonicalParams.set('trans', params.trans);
  if (params.country) canonicalParams.set('country', params.country);
  if (params.destinationCountry) canonicalParams.set('destinationCountry', params.destinationCountry);
  if (params.q) canonicalParams.set('q', params.q);
  if (params.yearMin) canonicalParams.set('yearMin', params.yearMin);
  if (params.yearMax) canonicalParams.set('yearMax', params.yearMax);
  if (params.priceMin) canonicalParams.set('priceMin', params.priceMin);
  if (params.priceMax) canonicalParams.set('priceMax', params.priceMax);
  if (params.mileageMax) canonicalParams.set('mileageMax', params.mileageMax);
  const canonicalQs = canonicalParams.toString();
  const canonicalUrl = canonicalQs ? `${SITE_URL}/vehicles?${canonicalQs}` : `${SITE_URL}/vehicles`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !canonicalQs, // Only index unfiltered listing page
      follow: true,
    },
  };
}

interface VehiclesPageProps {
  searchParams: Promise<{
    q?: string;
    make?: string;
    model?: string;
    bodyType?: string;
    fuel?: string;
    trans?: string;
    country?: string;
    destinationCountry?: string;
    sort?: string;
    page?: string;
    yearMin?: string;
    yearMax?: string;
    priceMin?: string;
    priceMax?: string;
    mileageMax?: string;
  }>;
}

async function VehiclesContent({ searchParams }: VehiclesPageProps) {
  const params = await searchParams;

  // Resolve destination country slug → UUID
  let destinationCountryIds: string[] | undefined;
  if (params.destinationCountry) {
    const slug = decodeURIComponent(params.destinationCountry);
    const { countries: countriesTable } = await import('@/server/db/schema');
    const { db } = await import('@/server/db/client');
    const { eq } = await import('drizzle-orm');
    const rows = await db.select({ id: countriesTable.id }).from(countriesTable).where(eq(countriesTable.slug, slug));
    if (rows.length > 0) {
      destinationCountryIds = [rows[0].id];
    } else {
      const continents = await fetchHomepageContinents();
      const { currencies, exchangeRates } = await getCurrencyData();
      return (
        <VehiclesPageClient
          initialVehicles={[]}
          initialTotal={0}
          initialPage={1}
          initialTotalPages={0}
          initialFilters={{ makes: [], models: [], bodyTypes: [], fuelTypes: [], transmissions: [], countries: [] }}
          initialSort={params.sort ?? 'newest'}
          initialSearch={params.q ?? ''}
          initialQueryParams={params}
          initialContinents={continents}
          initialCurrencies={currencies}
          initialExchangeRates={exchangeRates}
        />
      );
    }
  }

  const filters: PublicVehicleFilters = {
    search: params.q || undefined,
    makes: parseArrayParam(params.make),
    models: parseArrayParam(params.model),
    bodyTypes: parseArrayParam(params.bodyType),
    fuelTypes: parseArrayParam(params.fuel),
    transmissions: parseArrayParam(params.trans),
    countries: parseArrayParam(params.country),
    destinationCountryIds,
    sort: params.sort || 'newest',
    page: params.page ? Math.max(1, parseInt(params.page, 10) || 1) : 1,
    limit: 12,
    yearMin: params.yearMin ? parseInt(params.yearMin, 10) || undefined : undefined,
    yearMax: params.yearMax ? parseInt(params.yearMax, 10) || undefined : undefined,
    priceMin: params.priceMin ? parseInt(params.priceMin, 10) || undefined : undefined,
    priceMax: params.priceMax ? parseInt(params.priceMax, 10) || undefined : undefined,
    mileageMax: params.mileageMax ? parseInt(params.mileageMax, 10) || undefined : undefined,
  };

  const data = await getPublicVehicles(filters);
  const continents = await fetchHomepageContinents();
  const { currencies, exchangeRates } = await getCurrencyData();

  return (
    <VehiclesPageClient
      initialVehicles={data.vehicles}
      initialTotal={data.total}
      initialPage={data.page}
      initialTotalPages={data.totalPages}
      initialFilters={data.filters}
      initialSort={filters.sort ?? 'newest'}
      initialSearch={filters.search ?? ''}
      initialQueryParams={params}
      initialContinents={continents}
      initialCurrencies={currencies}
      initialExchangeRates={exchangeRates}
    />
  );
}

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1440px] px-4 py-10">
          <div className="mb-8 space-y-2">
            <div className="h-10 w-48 rounded bg-muted animate-pulse" />
            <div className="h-5 w-96 rounded bg-muted animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col">
                <div className="aspect-[4/3] bg-muted/60 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-6 w-1/3 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <VehiclesContent searchParams={searchParams} />
    </Suspense>
  );
}
