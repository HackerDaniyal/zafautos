import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/server/db/client';
import { countries, vehicleDestinationCountries, vehicles } from '@/server/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { getPublicVehicles, type PublicVehicleFilters } from '@/server/actions/publicVehicleActions';
import { DestinationPageClient } from './DestinationPageClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zafautos.com';

function parseArrayParam(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const decoded = decodeURIComponent(value);
  const items = decoded.split(',').map((s) => s.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

interface DestinationPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [country] = await db
    .select()
    .from(countries)
    .where(and(eq(countries.slug, slug), isNull(countries.deletedAt)))
    .limit(1);

  if (!country) return { title: 'Destination Not Found | ZafAutos' };

  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(vehicleDestinationCountries)
    .innerJoin(vehicles, eq(vehicleDestinationCountries.vehicleId, vehicles.id))
    .where(and(
      eq(vehicleDestinationCountries.countryId, country.id),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
    ));

  return {
    title: `Japanese Cars for ${country.name} | ZafAutos`,
    description: `Browse Japanese vehicles available for export to ${country.name}. ${cnt} vehicles available with detailed specifications and photos.`,
    alternates: {
      canonical: `${SITE_URL}/vehicles/destination/${slug}`,
    },
    openGraph: {
      title: `Japanese Cars for ${country.name} | ZafAutos`,
      description: `Browse Japanese vehicles available for export to ${country.name}. ${cnt} vehicles available.`,
      type: 'website',
      url: `${SITE_URL}/vehicles/destination/${slug}`,
    },
  };
}

async function DestinationContent({ params, searchParams }: DestinationPageProps) {
  const { slug } = await params;
  const params_ = await searchParams;

  // Resolve country
  const [country] = await db
    .select()
    .from(countries)
    .where(and(eq(countries.slug, slug), isNull(countries.deletedAt)))
    .limit(1);

  if (!country || !country.isActive) {
    notFound();
  }

  // Get destination vehicle IDs via junction table
  const destVehicleRows = await db
    .select({ vehicleId: vehicleDestinationCountries.vehicleId })
    .from(vehicleDestinationCountries)
    .where(eq(vehicleDestinationCountries.countryId, country.id));
  const destVehicleIds = [...new Set(destVehicleRows.map((r) => r.vehicleId))];

  if (destVehicleIds.length === 0) {
    return (
      <DestinationPageClient
        countryName={country.name}
        countrySlug={country.slug}
        countryId={country.id}
        flagImage={country.flagImage}
        initialVehicles={[]}
        initialTotal={0}
        initialPage={1}
        initialTotalPages={0}
        initialFilters={{ makes: [], models: [], bodyTypes: [], fuelTypes: [], transmissions: [], countries: [] }}
        initialSort={params_.sort ?? 'newest'}
        initialSearch={params_.q ?? ''}
        initialQueryParams={params_}
      />
    );
  }

  // Build filters with destination constraint
  const filters: PublicVehicleFilters = {
    search: params_.q || undefined,
    makes: parseArrayParam(params_.make),
    models: parseArrayParam(params_.model),
    bodyTypes: parseArrayParam(params_.bodyType),
    fuelTypes: parseArrayParam(params_.fuel),
    transmissions: parseArrayParam(params_.trans),
    countries: parseArrayParam(params_.country),
    destinationCountryIds: [country.id],
    sort: params_.sort || 'newest',
    page: params_.page ? Math.max(1, parseInt(params_.page, 10) || 1) : 1,
    limit: 12,
    yearMin: params_.yearMin ? parseInt(params_.yearMin, 10) || undefined : undefined,
    yearMax: params_.yearMax ? parseInt(params_.yearMax, 10) || undefined : undefined,
    priceMin: params_.priceMin ? parseInt(params_.priceMin, 10) || undefined : undefined,
    priceMax: params_.priceMax ? parseInt(params_.priceMax, 10) || undefined : undefined,
    mileageMax: params_.mileageMax ? parseInt(params_.mileageMax, 10) || undefined : undefined,
  };

  const data = await getPublicVehicles(filters);

  return (
    <DestinationPageClient
      countryName={country.name}
      countrySlug={country.slug}
      countryId={country.id}
      flagImage={country.flagImage}
      initialVehicles={data.vehicles}
      initialTotal={data.total}
      initialPage={data.page}
      initialTotalPages={data.totalPages}
      initialFilters={data.filters}
      initialSort={filters.sort ?? 'newest'}
      initialSearch={filters.search ?? ''}
      initialQueryParams={params_}
    />
  );
}

export default async function DestinationPage({ params, searchParams }: DestinationPageProps) {
  return <DestinationContent params={params} searchParams={searchParams} />;
}
