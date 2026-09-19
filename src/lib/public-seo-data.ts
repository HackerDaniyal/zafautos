import { db } from '@/server/db/client';
import {
  vehicles,
  manufacturers,
  models,
  bodyTypes,
  fuelTypes,
  transmissions,
  countries,
  vehicleImages,
  vehicleDestinationCountries,
} from '@/server/db/schema';
import { eq, and, isNull, desc, sql, inArray } from 'drizzle-orm';
import { resolveVehicleImageUrl } from '@/lib/utils/vehicle-images';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zafautos.com';

export interface SeoLandingPageData {
  title: string;
  description: string;
  canonicalUrl: string;
  entity: {
    name: string;
    slug: string;
    type: 'manufacturer' | 'model' | 'bodyType' | 'destination';
    parentName?: string;
  };
  vehicles: Array<{
    id: string;
    slug: string;
    year: number;
    make: string;
    model: string;
    price: number;
    currency: string;
    mileage: number;
    fuelType: string;
    transmission: string;
    bodyType: string;
    location: string;
    condition: string;
    imageUrl: string | null;
    imageCount: number;
    stockId: string | null;
    isFeatured: boolean;
  }>;
  totalVehicles: number;
  relatedEntities?: Array<{ name: string; slug: string; count: number }>;
}

export async function getManufacturerSeoData(slug: string): Promise<SeoLandingPageData | null> {
  const [manufacturer] = await db
    .select()
    .from(manufacturers)
    .where(and(
      eq(manufacturers.slug, slug),
      isNull(manufacturers.deletedAt),
    ))
    .limit(1);

  if (!manufacturer) return null;

  // Get vehicle count
  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(and(
      eq(vehicles.manufacturerId, manufacturer.id),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
    ));

  // Get published vehicles with images
  const vehiclesList = await db
    .select({
      id: vehicles.id,
      slug: vehicles.slug,
      year: vehicles.year,
      price: vehicles.price,
      mileage: vehicles.mileage,
      condition: vehicles.condition,
      isFeatured: vehicles.isFeatured,
      stockNumber: vehicles.stockNumber,
      manufacturerId: vehicles.manufacturerId,
      modelId: vehicles.modelId,
      bodyTypeId: vehicles.bodyTypeId,
      fuelTypeId: vehicles.fuelTypeId,
      transmissionId: vehicles.transmissionId,
      countryId: vehicles.countryId,
    })
    .from(vehicles)
    .where(and(
      eq(vehicles.manufacturerId, manufacturer.id),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
    ))
    .orderBy(desc(vehicles.isFeatured), desc(vehicles.createdAt))
    .limit(50);

  // Fetch relations
  const modelIds = [...new Set(vehiclesList.map(v => v.modelId).filter(Boolean))] as string[];
  const bodyTypeIds = [...new Set(vehiclesList.map(v => v.bodyTypeId).filter(Boolean))] as string[];
  const fuelTypeIds = [...new Set(vehiclesList.map(v => v.fuelTypeId).filter(Boolean))] as string[];
  const transmissionIds = [...new Set(vehiclesList.map(v => v.transmissionId).filter(Boolean))] as string[];
  const countryIds = [...new Set(vehiclesList.map(v => v.countryId).filter(Boolean))] as string[];
  const vehicleIds = vehiclesList.map(v => v.id);

  const [modelsData, bodyTypesData, fuelTypesData, transmissionsData, countriesData, imagesData] = await Promise.all([
    modelIds.length > 0 ? db.select().from(models).where(inArray(models.id, modelIds)) : Promise.resolve([]),
    bodyTypeIds.length > 0 ? db.select().from(bodyTypes).where(inArray(bodyTypes.id, bodyTypeIds)) : Promise.resolve([]),
    fuelTypeIds.length > 0 ? db.select().from(fuelTypes).where(inArray(fuelTypes.id, fuelTypeIds)) : Promise.resolve([]),
    transmissionIds.length > 0 ? db.select().from(transmissions).where(inArray(transmissions.id, transmissionIds)) : Promise.resolve([]),
    countryIds.length > 0 ? db.select().from(countries).where(inArray(countries.id, countryIds)) : Promise.resolve([]),
    vehicleIds.length > 0 ? db.select().from(vehicleImages).where(inArray(vehicleImages.vehicleId, vehicleIds)) : Promise.resolve([]),
  ]);

  const modelMap = new Map(modelsData.map(m => [m.id, m.name]));
  const bodyTypeMap = new Map(bodyTypesData.map(b => [b.id, b.name]));
  const fuelTypeMap = new Map(fuelTypesData.map(f => [f.id, f.name]));
  const transmissionMap = new Map(transmissionsData.map((t: any) => [t.id, t.name]));
  const countryMap = new Map(countriesData.map(c => [c.id, c.name]));

  // Build image maps
  const primaryImageMap = new Map<string, string>();
  const imageCountMap = new Map<string, number>();
  for (const img of imagesData) {
    imageCountMap.set(img.vehicleId, (imageCountMap.get(img.vehicleId) ?? 0) + 1);
    if (img.isPrimary) primaryImageMap.set(img.vehicleId, img.imageUrl);
  }
  for (const img of imagesData) {
    if (!primaryImageMap.has(img.vehicleId)) primaryImageMap.set(img.vehicleId, img.imageUrl);
  }

  const enrichedVehicles = vehiclesList.map(v => ({
    id: v.id,
    slug: v.slug ?? '',
    year: v.year ?? 0,
    make: manufacturer.name,
    model: v.modelId ? (modelMap.get(v.modelId) ?? 'Unknown') : 'Unknown',
    price: v.price ?? 0,
    currency: 'USD',
    mileage: v.mileage ?? 0,
    fuelType: v.fuelTypeId ? (fuelTypeMap.get(v.fuelTypeId) ?? 'Unknown') : 'Unknown',
    transmission: v.transmissionId ? (transmissionMap.get(v.transmissionId) ?? 'Unknown') : 'Unknown',
    bodyType: v.bodyTypeId ? (bodyTypeMap.get(v.bodyTypeId) ?? 'Unknown') : 'Unknown',
    location: v.countryId ? (countryMap.get(v.countryId) ?? '') : '',
    condition: v.condition ?? '',
    imageUrl: resolveVehicleImageUrl(primaryImageMap.get(v.id) ?? null),
    imageCount: imageCountMap.get(v.id) ?? 0,
    stockId: v.stockNumber ?? null,
    isFeatured: v.isFeatured ?? false,
  }));

  // Get related models for this manufacturer
  const relatedModels = await db
    .select({
      name: models.name,
      slug: models.slug,
      cnt: sql<number>`count(${vehicles.id})::int`,
    })
    .from(models)
    .leftJoin(vehicles, eq(vehicles.modelId, models.id))
    .where(and(
      eq(models.manufacturerId, manufacturer.id),
      isNull(models.deletedAt),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
    ))
    .groupBy(models.id, models.slug)
    .having(sql`count(${vehicles.id}) > 0`)
    .orderBy(desc(sql`count(${vehicles.id})`));

  return {
    title: `${manufacturer.name} Vehicles for Sale | ZafAutos`,
    description: `Browse our inventory of ${manufacturer.name} vehicles available for global export. ${cnt} ${manufacturer.name} vehicles in stock with detailed specifications and photos.`,
    canonicalUrl: `${SITE_URL}/vehicles/manufacturer/${slug}`,
    entity: {
      name: manufacturer.name,
      slug,
      type: 'manufacturer',
    },
    vehicles: enrichedVehicles,
    totalVehicles: cnt,
    relatedEntities: relatedModels.map(m => ({
      name: m.name,
      slug: m.slug ?? '',
      count: m.cnt,
    })),
  };
}

export async function getModelSeoData(slug: string): Promise<SeoLandingPageData | null> {
  const [model] = await db
    .select()
    .from(models)
    .where(and(
      eq(models.slug, slug),
      isNull(models.deletedAt),
    ))
    .limit(1);

  if (!model) return null;

  // Get manufacturer
  const [manufacturer] = model.manufacturerId
    ? await db.select().from(manufacturers).where(eq(manufacturers.id, model.manufacturerId)).limit(1)
    : [null];

  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(and(
      eq(vehicles.modelId, model.id),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
    ));

  // Similar to manufacturer data fetching...
  const vehiclesList = await db
    .select({
      id: vehicles.id,
      slug: vehicles.slug,
      year: vehicles.year,
      price: vehicles.price,
      mileage: vehicles.mileage,
      condition: vehicles.condition,
      isFeatured: vehicles.isFeatured,
      stockNumber: vehicles.stockNumber,
      bodyTypeId: vehicles.bodyTypeId,
      fuelTypeId: vehicles.fuelTypeId,
      transmissionId: vehicles.transmissionId,
      countryId: vehicles.countryId,
    })
    .from(vehicles)
    .where(and(
      eq(vehicles.modelId, model.id),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
    ))
    .orderBy(desc(vehicles.isFeatured), desc(vehicles.createdAt))
    .limit(50);

  const bodyTypeIds = [...new Set(vehiclesList.map(v => v.bodyTypeId).filter(Boolean))] as string[];
  const fuelTypeIds = [...new Set(vehiclesList.map(v => v.fuelTypeId).filter(Boolean))] as string[];
  const transmissionIds = [...new Set(vehiclesList.map(v => v.transmissionId).filter(Boolean))] as string[];
  const countryIds = [...new Set(vehiclesList.map(v => v.countryId).filter(Boolean))] as string[];
  const vehicleIds = vehiclesList.map(v => v.id);

  const [bodyTypesData, fuelTypesData, transmissionsData, countriesData, imagesData] = await Promise.all([
    bodyTypeIds.length > 0 ? db.select().from(bodyTypes).where(inArray(bodyTypes.id, bodyTypeIds)) : Promise.resolve([]),
    fuelTypeIds.length > 0 ? db.select().from(fuelTypes).where(inArray(fuelTypes.id, fuelTypeIds)) : Promise.resolve([]),
    transmissionIds.length > 0 ? db.select().from(transmissions).where(inArray(transmissions.id, transmissionIds)) : Promise.resolve([]),
    countryIds.length > 0 ? db.select().from(countries).where(inArray(countries.id, countryIds)) : Promise.resolve([]),
    vehicleIds.length > 0 ? db.select().from(vehicleImages).where(inArray(vehicleImages.vehicleId, vehicleIds)) : Promise.resolve([]),
  ]);

  const bodyTypeMap = new Map(bodyTypesData.map(b => [b.id, b.name]));
  const fuelTypeMap = new Map(fuelTypesData.map(f => [f.id, f.name]));
  const transmissionMap = new Map(transmissionsData.map((t: any) => [t.id, t.name]));
  const countryMap = new Map(countriesData.map(c => [c.id, c.name]));

  const primaryImageMap = new Map<string, string>();
  const imageCountMap = new Map<string, number>();
  for (const img of imagesData) {
    imageCountMap.set(img.vehicleId, (imageCountMap.get(img.vehicleId) ?? 0) + 1);
    if (img.isPrimary) primaryImageMap.set(img.vehicleId, img.imageUrl);
  }
  for (const img of imagesData) {
    if (!primaryImageMap.has(img.vehicleId)) primaryImageMap.set(img.vehicleId, img.imageUrl);
  }

  const makeName = manufacturer?.name ?? 'Unknown';
  const enrichedVehicles = vehiclesList.map(v => ({
    id: v.id,
    slug: v.slug ?? '',
    year: v.year ?? 0,
    make: makeName,
    model: model.name,
    price: v.price ?? 0,
    currency: 'USD',
    mileage: v.mileage ?? 0,
    fuelType: v.fuelTypeId ? (fuelTypeMap.get(v.fuelTypeId) ?? 'Unknown') : 'Unknown',
    transmission: v.transmissionId ? (transmissionMap.get(v.transmissionId) ?? 'Unknown') : 'Unknown',
    bodyType: v.bodyTypeId ? (bodyTypeMap.get(v.bodyTypeId) ?? 'Unknown') : 'Unknown',
    location: v.countryId ? (countryMap.get(v.countryId) ?? '') : '',
    condition: v.condition ?? '',
    imageUrl: resolveVehicleImageUrl(primaryImageMap.get(v.id) ?? null),
    imageCount: imageCountMap.get(v.id) ?? 0,
    stockId: v.stockNumber ?? null,
    isFeatured: v.isFeatured ?? false,
  }));

  return {
    title: `${makeName} ${model.name} Vehicles for Sale | ZafAutos`,
    description: `Browse our inventory of ${makeName} ${model.name} vehicles available for global export. ${cnt} ${makeName} ${model.name} vehicles in stock with detailed specifications.`,
    canonicalUrl: `${SITE_URL}/vehicles/model/${slug}`,
    entity: {
      name: model.name,
      slug,
      type: 'model',
      parentName: makeName,
    },
    vehicles: enrichedVehicles,
    totalVehicles: cnt,
  };
}

export async function getBodyTypeSeoData(slug: string): Promise<SeoLandingPageData | null> {
  // Body types don't have a slug column; match by lowercased name
  const [bodyType] = await db
    .select()
    .from(bodyTypes)
    .where(and(
      sql`lower(${bodyTypes.name}) = lower(${slug})`,
      isNull(bodyTypes.deletedAt),
    ))
    .limit(1);

  if (!bodyType) return null;

  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(and(
      eq(vehicles.bodyTypeId, bodyType.id),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
    ));

  const vehiclesList = await db
    .select({
      id: vehicles.id,
      slug: vehicles.slug,
      year: vehicles.year,
      price: vehicles.price,
      mileage: vehicles.mileage,
      condition: vehicles.condition,
      isFeatured: vehicles.isFeatured,
      stockNumber: vehicles.stockNumber,
      manufacturerId: vehicles.manufacturerId,
      modelId: vehicles.modelId,
      fuelTypeId: vehicles.fuelTypeId,
      transmissionId: vehicles.transmissionId,
      countryId: vehicles.countryId,
    })
    .from(vehicles)
    .where(and(
      eq(vehicles.bodyTypeId, bodyType.id),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
    ))
    .orderBy(desc(vehicles.isFeatured), desc(vehicles.createdAt))
    .limit(50);

  const manufacturerIds = [...new Set(vehiclesList.map(v => v.manufacturerId).filter(Boolean))] as string[];
  const modelIds = [...new Set(vehiclesList.map(v => v.modelId).filter(Boolean))] as string[];
  const fuelTypeIds = [...new Set(vehiclesList.map(v => v.fuelTypeId).filter(Boolean))] as string[];
  const transmissionIds = [...new Set(vehiclesList.map(v => v.transmissionId).filter(Boolean))] as string[];
  const countryIds = [...new Set(vehiclesList.map(v => v.countryId).filter(Boolean))] as string[];
  const vehicleIds = vehiclesList.map(v => v.id);

  const [manufacturersData, modelsData, fuelTypesData, transmissionsData, countriesData, imagesData] = await Promise.all([
    manufacturerIds.length > 0 ? db.select().from(manufacturers).where(inArray(manufacturers.id, manufacturerIds)) : Promise.resolve([]),
    modelIds.length > 0 ? db.select().from(models).where(inArray(models.id, modelIds)) : Promise.resolve([]),
    fuelTypeIds.length > 0 ? db.select().from(fuelTypes).where(inArray(fuelTypes.id, fuelTypeIds)) : Promise.resolve([]),
    transmissionIds.length > 0 ? db.select().from(transmissions).where(inArray(transmissions.id, transmissionIds)) : Promise.resolve([]),
    countryIds.length > 0 ? db.select().from(countries).where(inArray(countries.id, countryIds)) : Promise.resolve([]),
    vehicleIds.length > 0 ? db.select().from(vehicleImages).where(inArray(vehicleImages.vehicleId, vehicleIds)) : Promise.resolve([]),
  ]);

  const manufacturerMap = new Map(manufacturersData.map(m => [m.id, m.name]));
  const modelMap = new Map(modelsData.map(m => [m.id, m.name]));
  const fuelTypeMap = new Map(fuelTypesData.map(f => [f.id, f.name]));
  const transmissionMap = new Map(transmissionsData.map((t: any) => [t.id, t.name]));
  const countryMap = new Map(countriesData.map(c => [c.id, c.name]));

  const primaryImageMap = new Map<string, string>();
  const imageCountMap = new Map<string, number>();
  for (const img of imagesData) {
    imageCountMap.set(img.vehicleId, (imageCountMap.get(img.vehicleId) ?? 0) + 1);
    if (img.isPrimary) primaryImageMap.set(img.vehicleId, img.imageUrl);
  }
  for (const img of imagesData) {
    if (!primaryImageMap.has(img.vehicleId)) primaryImageMap.set(img.vehicleId, img.imageUrl);
  }

  const enrichedVehicles = vehiclesList.map(v => ({
    id: v.id,
    slug: v.slug ?? '',
    year: v.year ?? 0,
    make: v.manufacturerId ? (manufacturerMap.get(v.manufacturerId) ?? 'Unknown') : 'Unknown',
    model: v.modelId ? (modelMap.get(v.modelId) ?? 'Unknown') : 'Unknown',
    price: v.price ?? 0,
    currency: 'USD',
    mileage: v.mileage ?? 0,
    fuelType: v.fuelTypeId ? (fuelTypeMap.get(v.fuelTypeId) ?? 'Unknown') : 'Unknown',
    transmission: v.transmissionId ? (transmissionMap.get(v.transmissionId) ?? 'Unknown') : 'Unknown',
    bodyType: bodyType.name,
    location: v.countryId ? (countryMap.get(v.countryId) ?? '') : '',
    condition: v.condition ?? '',
    imageUrl: resolveVehicleImageUrl(primaryImageMap.get(v.id) ?? null),
    imageCount: imageCountMap.get(v.id) ?? 0,
    stockId: v.stockNumber ?? null,
    isFeatured: v.isFeatured ?? false,
  }));

  // Get top manufacturers for this body type
  const topManufacturers = await db
    .select({
      name: manufacturers.name,
      slug: manufacturers.slug,
      cnt: sql<number>`count(${vehicles.id})::int`,
    })
    .from(manufacturers)
    .innerJoin(vehicles, eq(vehicles.manufacturerId, manufacturers.id))
    .where(and(
      eq(vehicles.bodyTypeId, bodyType.id),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
      isNull(manufacturers.deletedAt),
    ))
    .groupBy(manufacturers.id, manufacturers.slug)
    .orderBy(desc(sql`count(${vehicles.id})`))
    .limit(8);

  return {
    title: `${bodyType.name} Vehicles for Sale | ZafAutos`,
    description: `Browse our inventory of ${bodyType.name} vehicles available for global export. ${cnt} ${bodyType.name} vehicles in stock with detailed specifications.`,
    canonicalUrl: `${SITE_URL}/vehicles/body-type/${slug}`,
    entity: {
      name: bodyType.name,
      slug,
      type: 'bodyType',
    },
    vehicles: enrichedVehicles,
    totalVehicles: cnt,
    relatedEntities: topManufacturers.map(m => ({
      name: m.name,
      slug: m.slug ?? '',
      count: m.cnt,
    })),
  };
}

export async function getDestinationSeoData(slug: string): Promise<SeoLandingPageData | null> {
  const [country] = await db
    .select()
    .from(countries)
    .where(and(
      eq(countries.slug, slug),
      isNull(countries.deletedAt),
    ))
    .limit(1);

  if (!country) return null;

  // Get vehicle IDs available for this destination via junction table
  const destVehicleRows = await db
    .select({ vehicleId: vehicleDestinationCountries.vehicleId })
    .from(vehicleDestinationCountries)
    .where(eq(vehicleDestinationCountries.countryId, country.id));
  const destVehicleIds = [...new Set(destVehicleRows.map((r) => r.vehicleId))];

  if (destVehicleIds.length === 0) return null;

  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(and(
      inArray(vehicles.id, destVehicleIds),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
    ));

  if (cnt === 0) return null;

  const vehiclesList = await db
    .select({
      id: vehicles.id,
      slug: vehicles.slug,
      year: vehicles.year,
      price: vehicles.price,
      mileage: vehicles.mileage,
      condition: vehicles.condition,
      isFeatured: vehicles.isFeatured,
      stockNumber: vehicles.stockNumber,
      manufacturerId: vehicles.manufacturerId,
      modelId: vehicles.modelId,
      bodyTypeId: vehicles.bodyTypeId,
      fuelTypeId: vehicles.fuelTypeId,
      transmissionId: vehicles.transmissionId,
    })
    .from(vehicles)
    .where(and(
      inArray(vehicles.id, destVehicleIds),
      eq(vehicles.status, 'active'),
      isNull(vehicles.deletedAt),
    ))
    .orderBy(desc(vehicles.isFeatured), desc(vehicles.createdAt))
    .limit(50);

  const manufacturerIds = [...new Set(vehiclesList.map(v => v.manufacturerId).filter(Boolean))] as string[];
  const modelIds = [...new Set(vehiclesList.map(v => v.modelId).filter(Boolean))] as string[];
  const bodyTypeIds = [...new Set(vehiclesList.map(v => v.bodyTypeId).filter(Boolean))] as string[];
  const fuelTypeIds = [...new Set(vehiclesList.map(v => v.fuelTypeId).filter(Boolean))] as string[];
  const transmissionIds = [...new Set(vehiclesList.map(v => v.transmissionId).filter(Boolean))] as string[];
  const vehicleIds = vehiclesList.map(v => v.id);

  const [manufacturersData, modelsData, bodyTypesData, fuelTypesData, transmissionsData, imagesData] = await Promise.all([
    manufacturerIds.length > 0 ? db.select().from(manufacturers).where(inArray(manufacturers.id, manufacturerIds)) : Promise.resolve([]),
    modelIds.length > 0 ? db.select().from(models).where(inArray(models.id, modelIds)) : Promise.resolve([]),
    bodyTypeIds.length > 0 ? db.select().from(bodyTypes).where(inArray(bodyTypes.id, bodyTypeIds)) : Promise.resolve([]),
    fuelTypeIds.length > 0 ? db.select().from(fuelTypes).where(inArray(fuelTypes.id, fuelTypeIds)) : Promise.resolve([]),
    transmissionIds.length > 0 ? db.select().from(transmissions).where(inArray(transmissions.id, transmissionIds)) : Promise.resolve([]),
    vehicleIds.length > 0 ? db.select().from(vehicleImages).where(inArray(vehicleImages.vehicleId, vehicleIds)) : Promise.resolve([]),
  ]);

  const manufacturerMap = new Map(manufacturersData.map(m => [m.id, m.name]));
  const modelMap = new Map(modelsData.map(m => [m.id, m.name]));
  const bodyTypeMap = new Map(bodyTypesData.map(b => [b.id, b.name]));
  const fuelTypeMap = new Map(fuelTypesData.map(f => [f.id, f.name]));
  const transmissionMap = new Map(transmissionsData.map((t: any) => [t.id, t.name]));

  const primaryImageMap = new Map<string, string>();
  const imageCountMap = new Map<string, number>();
  for (const img of imagesData) {
    imageCountMap.set(img.vehicleId, (imageCountMap.get(img.vehicleId) ?? 0) + 1);
    if (img.isPrimary) primaryImageMap.set(img.vehicleId, img.imageUrl);
  }
  for (const img of imagesData) {
    if (!primaryImageMap.has(img.vehicleId)) primaryImageMap.set(img.vehicleId, img.imageUrl);
  }

  const enrichedVehicles = vehiclesList.map(v => ({
    id: v.id,
    slug: v.slug ?? '',
    year: v.year ?? 0,
    make: v.manufacturerId ? (manufacturerMap.get(v.manufacturerId) ?? 'Unknown') : 'Unknown',
    model: v.modelId ? (modelMap.get(v.modelId) ?? 'Unknown') : 'Unknown',
    price: v.price ?? 0,
    currency: 'USD',
    mileage: v.mileage ?? 0,
    fuelType: v.fuelTypeId ? (fuelTypeMap.get(v.fuelTypeId) ?? 'Unknown') : 'Unknown',
    transmission: v.transmissionId ? (transmissionMap.get(v.transmissionId) ?? 'Unknown') : 'Unknown',
    bodyType: v.bodyTypeId ? (bodyTypeMap.get(v.bodyTypeId) ?? 'Unknown') : 'Unknown',
    location: country.name,
    condition: v.condition ?? '',
    imageUrl: resolveVehicleImageUrl(primaryImageMap.get(v.id) ?? null),
    imageCount: imageCountMap.get(v.id) ?? 0,
    stockId: v.stockNumber ?? null,
    isFeatured: v.isFeatured ?? false,
  }));

  return {
    title: `Japanese Cars for ${country.name} | ZafAutos`,
    description: `Browse Japanese vehicles available for export to ${country.name}. ${cnt} vehicles available with detailed specifications and photos.`,
    canonicalUrl: `${SITE_URL}/vehicles/destination/${slug}`,
    entity: {
      name: country.name,
      slug,
      type: 'destination',
    },
    vehicles: enrichedVehicles,
    totalVehicles: cnt,
  };
}
