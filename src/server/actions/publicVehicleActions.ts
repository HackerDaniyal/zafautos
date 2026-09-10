'use server';

import { VehicleRepository } from '@/server/repositories/vehicleRepository';
import {
  manufacturers,
  models as modelsTable,
  bodyTypes as bodyTypesTable,
  fuelTypes as fuelTypesTable,
  transmissions as transmissionsTable,
  countries as countriesTable,
  currencies,
} from '@/server/db/schema';
import { and, sql, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';

const vehicleRepo = new VehicleRepository();

export interface PublicVehicleFilters {
  search?: string;
  makes?: string[];
  models?: string[];
  bodyTypes?: string[];
  fuelTypes?: string[];
  transmissions?: string[];
  countries?: string[];
  destinationCountryIds?: string[];
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  isFeatured?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PublicVehicleListResult {
  vehicles: Array<{
    id: string;
    slug: string;
    make: string;
    model: string;
    year: number;
    price: number;
    currency: string;
    mileage: number;
    fuelType: string;
    transmission: string;
    bodyType: string;
    location: string;
    condition: string;
    isFeatured: boolean;
    imageUrl: string | null;
    imageCount: number;
    stockId: string | null;
    recentlyAdded: boolean;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    makes: Array<{ id: string; name: string; count: number }>;
    models: Array<{ id: string; name: string; count: number }>;
    bodyTypes: Array<{ id: string; name: string; count: number }>;
    fuelTypes: Array<{ id: string; name: string; count: number }>;
    transmissions: Array<{ id: string; name: string; count: number }>;
    countries: Array<{ id: string; name: string; count: number }>;
  };
}

function parseSort(sort: string): { column: string; direction: 'asc' | 'desc' } {
  switch (sort) {
    case 'price-asc': return { column: 'price', direction: 'asc' };
    case 'price-desc': return { column: 'price', direction: 'desc' };
    case 'year-desc': return { column: 'year', direction: 'desc' };
    case 'year-asc': return { column: 'year', direction: 'asc' };
    case 'mileage-asc': return { column: 'mileage', direction: 'asc' };
    case 'mileage-desc': return { column: 'mileage', direction: 'desc' };
    case 'newest': return { column: 'createdAt', direction: 'desc' };
    default: return { column: 'createdAt', direction: 'desc' };
  }
}

async function resolveIds(
  table: any,
  names: string[] | undefined,
): Promise<string[] | undefined> {
  if (!names || names.length === 0) return undefined;
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(
      and(
        sql`${table.deletedAt} IS NULL`,
        sql`${table.name} IN ${names}`,
      ),
    );
  const ids = rows.map((r) => r.id as string);
  return ids.length > 0 ? ids : undefined;
}

async function resolveModelIdsByManufacturer(
  modelNames: string[] | undefined,
  manufacturerIds: string[] | undefined,
): Promise<string[] | undefined> {
  if (!modelNames || modelNames.length === 0) return undefined;
  const conditions: any[] = [
    sql`${modelsTable.deletedAt} IS NULL`,
    sql`${modelsTable.name} IN ${modelNames}`,
  ];
  if (manufacturerIds && manufacturerIds.length > 0) {
    conditions.push(sql`${modelsTable.manufacturerId} IN ${manufacturerIds}`);
  }
  const rows = await db
    .select({ id: modelsTable.id })
    .from(modelsTable)
    .where(and(...conditions));
  const ids = rows.map((r) => r.id as string);
  return ids.length > 0 ? ids : undefined;
}

async function resolveNames(
  table: any,
  counts: { id: string; count: number }[],
): Promise<Array<{ id: string; name: string; count: number }>> {
  if (counts.length === 0) return [];
  const idList = counts.map((i) => i.id);
  const rows = await db
    .select({ id: table.id, name: table.name })
    .from(table)
    .where(sql`${table.id} IN ${idList}`);
  const nameMap = new Map(rows.map((r) => [r.id as string, r.name as string]));
  return counts
    .map((i) => ({ id: i.id, name: nameMap.get(i.id) ?? i.id, count: i.count }))
    .filter((i) => i.name)
    .sort((a, b) => b.count - a.count);
}

export async function getPublicVehicles(
  params: PublicVehicleFilters = {},
): Promise<PublicVehicleListResult> {
  const {
    search,
    makes,
    models: modelNames,
    bodyTypes,
    fuelTypes,
    transmissions,
    countries,
    destinationCountryIds,
    yearMin,
    yearMax,
    priceMin,
    priceMax,
    mileageMax,
    isFeatured,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = params;

  const [manufacturerIds, bodyTypeIds, fuelTypeIds, transmissionIds, countryIds] = await Promise.all([
    resolveIds(manufacturers, makes),
    resolveIds(bodyTypesTable, bodyTypes),
    resolveIds(fuelTypesTable, fuelTypes),
    resolveIds(transmissionsTable, transmissions),
    resolveIds(countriesTable, countries),
  ]);

  const modelIds = await resolveModelIdsByManufacturer(modelNames, manufacturerIds);

  // If destination country filter is applied, get vehicle IDs that have those destinations
  let destinationVehicleIds: string[] | undefined;
  if (destinationCountryIds && destinationCountryIds.length > 0) {
    const { vehicleDestinationCountries } = await import('@/server/db/schema');
    const destRows = await db
      .select({ vehicleId: vehicleDestinationCountries.vehicleId })
      .from(vehicleDestinationCountries)
      .where(sql`${vehicleDestinationCountries.countryId} IN ${destinationCountryIds}`);
    destinationVehicleIds = [...new Set(destRows.map((r) => r.vehicleId))];
    if (destinationVehicleIds.length === 0) {
      return { vehicles: [], total: 0, page, limit, totalPages: 0, filters: { makes: [], models: [], bodyTypes: [], fuelTypes: [], transmissions: [], countries: [] } };
    }
  }

  const sortOpts = parseSort(sort);

  // Main query — all filters applied at DB level, no in-memory filtering
  const result = await vehicleRepo.listWithRelations({
    filters: {
      status: 'active',
      manufacturerIds,
      modelIds,
      bodyTypeIds,
      fuelTypeIds,
      transmissionIds,
      countryIds,
      destinationVehicleIds,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      mileageMax,
      isFeatured,
      search,
    },
    pagination: { page, limit },
    sort: { column: sortOpts.column, direction: sortOpts.direction },
  });

  // Context-aware filter counts: counts reflect current filter state
  // Build "everything EXCEPT this filter" to get counts for remaining options
  const baseFilters = {
    status: 'active' as const,
    manufacturerIds,
    modelIds,
    bodyTypeIds,
    fuelTypeIds,
    transmissionIds,
    countryIds,
    destinationVehicleIds,
    yearMin,
    yearMax,
    priceMin,
    priceMax,
    mileageMax,
    isFeatured,
    search,
  };

  const [
    makesCountsRaw,
    bodyTypesCountsRaw,
    fuelTypesCountsRaw,
    transmissionsCountsRaw,
    countriesCountsRaw,
  ] = await Promise.all([
    // For makes: count excluding manufacturer filter
    vehicleRepo.countActiveVehiclesByEntityFiltered('manufacturer', {
      ...baseFilters,
      manufacturerIds: undefined,
    }),
    // For body types: count excluding bodyType filter
    vehicleRepo.countActiveVehiclesByEntityFiltered('bodyType', {
      ...baseFilters,
      bodyTypeIds: undefined,
    }),
    // For fuel types: count excluding fuelType filter
    vehicleRepo.countActiveVehiclesByEntityFiltered('fuelType', {
      ...baseFilters,
      fuelTypeIds: undefined,
    }),
    // For transmissions: count excluding transmission filter
    vehicleRepo.countActiveVehiclesByEntityFiltered('transmission', {
      ...baseFilters,
      transmissionIds: undefined,
    }),
    // For countries: count excluding country filter
    vehicleRepo.countActiveVehiclesByEntityFiltered('country', {
      ...baseFilters,
      countryIds: undefined,
    }),
  ]);

  // Models: only show models for selected makes (Make→Model dependency)
  const modelCountsRaw = manufacturerIds && manufacturerIds.length > 0
    ? await vehicleRepo.countActiveModelsFiltered(manufacturerIds, {
        ...baseFilters,
        modelIds: undefined,
      })
    : await vehicleRepo.countActiveModelsFiltered([], {
        ...baseFilters,
        modelIds: undefined,
      });

  const [makesFilters, modelsFilters, bodyTypesFilters, fuelTypesFilters, transmissionsFilters, countriesFilters] =
    await Promise.all([
      resolveNames(manufacturers, makesCountsRaw),
      resolveNames(modelsTable, modelCountsRaw),
      resolveNames(bodyTypesTable, bodyTypesCountsRaw),
      resolveNames(fuelTypesTable, fuelTypesCountsRaw),
      resolveNames(transmissionsTable, transmissionsCountsRaw),
      resolveNames(countriesTable, countriesCountsRaw),
    ]);

  // Resolve currencies for vehicles
  const currencyIds = [...new Set(result.data.map((v: any) => v.currencyId).filter(Boolean))] as string[];
  const currenciesData = currencyIds.length > 0
    ? await db.select({ id: sql<string>`${sql.identifier('id')}`, code: sql<string>`${sql.identifier('code')}` })
        .from(currencies)
        .where(sql`${sql.identifier('id')} IN ${currencyIds}`)
    : [];
  const currencyMap = new Map(currenciesData.map((c) => [c.id, c.code]));

  const vehicles = result.data.map((v: any) => ({
    id: v.id,
    slug: v.slug ?? '',
    make: v._manufacturerName ?? 'Unknown',
    model: v._modelName ?? 'Unknown',
    year: v.year ?? 0,
    price: v.price ?? 0,
    currency: v.currencyId ? (currencyMap.get(v.currencyId) ?? 'USD') : 'USD',
    mileage: v.mileage ?? 0,
    fuelType: v._fuelTypeName ?? 'Unknown',
    transmission: v._transmissionTypeName ?? 'Unknown',
    bodyType: v._bodyTypeName ?? 'Unknown',
    location: v._countryName ?? '',
    condition: v.condition ?? '',
    isFeatured: v.isFeatured ?? false,
    imageUrl: v.primaryImageUrl ?? null,
    imageCount: (v as any)._imageCount ?? 0,
    stockId: v.stockNumber ?? null,
    recentlyAdded: v.createdAt
      ? new Date(v.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
      : false,
  }));

  return {
    vehicles,
    total: result.meta.total,
    page,
    limit,
    totalPages: result.meta.totalPages,
    filters: {
      makes: makesFilters,
      models: modelsFilters,
      bodyTypes: bodyTypesFilters,
      fuelTypes: fuelTypesFilters,
      transmissions: transmissionsFilters,
      countries: countriesFilters,
    },
  };
}

export async function getPublicVehicleBySlug(slug: string) {
  const vehicle = await vehicleRepo.findBySlug(slug);
  if (!vehicle) return null;

  // CRITICAL: Only return active, non-deleted vehicles on public pages
  if (vehicle.status !== 'active' || vehicle.deletedAt) return null;

  const [relations, imageData, features] = await Promise.all([
    vehicleRepo.getVehicleRelations(vehicle.id),
    vehicleRepo.getVehicleWithImages(vehicle.id),
    vehicleRepo.getVehicleFeatures(vehicle.id),
  ]);

  return {
    vehicle: {
      id: vehicle.id,
      slug: vehicle.slug ?? '',
      make: relations?.manufacturerName ?? 'Unknown',
      model: relations?.modelName ?? 'Unknown',
      year: vehicle.year ?? 0,
      price: vehicle.price ?? 0,
      currency: relations?.currencyCode ?? 'USD',
      mileage: vehicle.mileage ?? 0,
      fuelType: relations?.fuelTypeName ?? '',
      transmission: relations?.transmissionName ?? '',
      bodyType: relations?.bodyTypeName ?? '',
      driveType: relations?.driveTypeName ?? '',
      color: relations?.colorName ?? '',
      location: relations?.countryName ?? '',
      country: relations?.countryName ?? '',
      condition: vehicle.condition ?? '',
      isFeatured: vehicle.isFeatured ?? false,
      stockId: vehicle.stockNumber ?? null,
      vin: vehicle.vin ?? null,
      engineSize: vehicle.engineCc ?? null,
      horsepower: vehicle.horsepower ?? null,
      doors: vehicle.doors ?? null,
      seats: vehicle.seats ?? null,
      manufacturerId: vehicle.manufacturerId,
      modelId: vehicle.modelId,
      bodyTypeId: vehicle.bodyTypeId,
      createdAt: vehicle.createdAt,
      auctionGrade: vehicle.auctionGrade ?? null,
    },
    images: imageData?.images ?? [],
    features: (features ?? []).map((f: any) => f.name as string),
    relations,
  };
}

export async function getSimilarPublicVehicles(
  manufacturerId: string | null,
  excludeId: string,
  limitCount = 4,
  vehicle?: {
    modelId?: string;
    bodyTypeId?: string;
    price?: number;
    priceCurrencyCode?: string;
  },
) {
  if (!manufacturerId) return [];

  // Try to find vehicles with same model first, then fallback to same manufacturer
  let result;
  if (vehicle?.modelId) {
    result = await vehicleRepo.listWithRelations({
      filters: {
        status: 'active',
        manufacturerIds: [manufacturerId],
        modelIds: [vehicle.modelId],
      },
      pagination: { page: 1, limit: limitCount + 1 },
      sort: { column: 'createdAt', direction: 'desc' },
    });

    // If not enough same-model vehicles, also fetch same-manufacturer
    if (result.data.length <= 1) {
      result = await vehicleRepo.listWithRelations({
        filters: {
          status: 'active',
          manufacturerIds: [manufacturerId],
        },
        pagination: { page: 1, limit: limitCount + 1 },
        sort: { column: 'createdAt', direction: 'desc' },
      });
    }
  } else {
    result = await vehicleRepo.listWithRelations({
      filters: {
        status: 'active',
        manufacturerIds: [manufacturerId],
      },
      pagination: { page: 1, limit: limitCount + 1 },
      sort: { column: 'createdAt', direction: 'desc' },
    });
  }

  // Score vehicles by similarity: same model +3, same body type +1, then sort by score
  const scored = result.data
    .filter((v) => v.id !== excludeId)
    .map((v: any) => {
      let score = 0;
      if (vehicle?.modelId && v.modelId === vehicle.modelId) score += 3;
      if (vehicle?.bodyTypeId && v.bodyTypeId === vehicle.bodyTypeId) score += 1;
      if (vehicle?.price && v.price) {
        const diff = Math.abs(v.price - vehicle.price) / vehicle.price;
        if (diff < 0.3) score += 2;
        else if (diff < 0.5) score += 1;
      }
      return { vehicle: v, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limitCount);

  return scored.map(({ vehicle: v }: { vehicle: any }) => ({
    id: v.id,
    slug: v.slug ?? '',
    make: v._manufacturerName ?? 'Unknown',
    model: v._modelName ?? 'Unknown',
    year: v.year ?? 0,
    price: v.price ?? 0,
    currency: 'USD',
    mileage: v.mileage ?? 0,
    fuelType: v._fuelTypeName ?? 'Unknown',
    transmission: v._transmissionTypeName ?? 'Unknown',
    bodyType: v._bodyTypeName ?? 'Unknown',
    location: v._countryName ?? '',
    condition: v.condition ?? '',
    isFeatured: v.isFeatured ?? false,
    imageUrl: v.primaryImageUrl ?? null,
    imageCount: (v as any)._imageCount ?? 0,
    stockId: v.stockNumber ?? null,
    recentlyAdded: false,
  }));
}
