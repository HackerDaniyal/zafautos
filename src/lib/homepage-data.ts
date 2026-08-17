import { CmsRepository } from '@/server/repositories';
import { VehicleRepository } from '@/server/repositories';
import { db } from '@/server/db/client';
import { vehicles, vehicleImages, manufacturers, bodyTypes, fuelTypes, transmissions, countries } from '@/server/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type { VehicleCardData } from '@/components/marketplace/VehicleCard';

const cmsRepo = new CmsRepository();
const vehicleRepo = new VehicleRepository();

export interface HomepageSectionData {
  id: string;
  type: string;
  isEnabled: boolean;
  displayOrder: number;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  button2Label: string | null;
  button2Url: string | null;
  extraData: Record<string, unknown> | null;
}

export interface HomepageData {
  sections: HomepageSectionData[];
  featuredVehicles: VehicleCardData[];
  latestVehicles: VehicleCardData[];
}

async function fetchVehiclesWithImages(
  filters: { isFeatured?: boolean; status?: string },
  limit: number,
): Promise<VehicleCardData[]> {
  const conditions = [sql`${vehicles.deletedAt} IS NULL`];
  conditions.push(eq(vehicles.status, (filters.status ?? 'active') as 'active'));
  if (filters.isFeatured !== undefined) {
    conditions.push(eq(vehicles.isFeatured, filters.isFeatured));
  }

  const vehicleRows = await db
    .select({
      id: vehicles.id,
      slug: vehicles.slug,
      year: vehicles.year,
      price: vehicles.price,
      mileage: vehicles.mileage,
      condition: vehicles.condition,
      isFeatured: vehicles.isFeatured,
      stockNumber: vehicles.stockNumber,
      manufacturerName: manufacturers.name,
      bodyTypeName: bodyTypes.name,
      fuelTypeName: fuelTypes.name,
      transmissionName: transmissions.name,
      countryName: countries.name,
    })
    .from(vehicles)
    .leftJoin(manufacturers, eq(vehicles.manufacturerId, manufacturers.id))
    .leftJoin(bodyTypes, eq(vehicles.bodyTypeId, bodyTypes.id))
    .leftJoin(fuelTypes, eq(vehicles.fuelTypeId, fuelTypes.id))
    .leftJoin(transmissions, eq(vehicles.transmissionId, transmissions.id))
    .leftJoin(countries, eq(vehicles.countryId, countries.id))
    .where(and(...conditions))
    .orderBy(desc(vehicles.createdAt))
    .limit(limit);

  if (vehicleRows.length === 0) return [];

  const vehicleIds = vehicleRows.map((v) => v.id);
  const imageRows = await db
    .select({
      vehicleId: vehicleImages.vehicleId,
      imageUrl: vehicleImages.imageUrl,
      isPrimary: vehicleImages.isPrimary,
      sortOrder: vehicleImages.sortOrder,
    })
    .from(vehicleImages)
    .where(inArray(vehicleImages.vehicleId, vehicleIds))
    .orderBy(vehicleImages.sortOrder);

  const primaryImages = new Map<string, string>();
  const imageCounts = new Map<string, number>();
  for (const img of imageRows) {
    const count = imageCounts.get(img.vehicleId) ?? 0;
    imageCounts.set(img.vehicleId, count + 1);
    if (img.isPrimary || !primaryImages.has(img.vehicleId)) {
      primaryImages.set(img.vehicleId, img.imageUrl);
    }
  }

  return vehicleRows.map((v) => ({
    id: v.id,
    slug: v.slug ?? '',
    make: v.manufacturerName ?? 'Unknown',
    model: '',
    year: v.year ?? 0,
    price: v.price ?? 0,
    currency: 'USD',
    mileage: v.mileage ?? 0,
    fuelType: v.fuelTypeName ?? '',
    transmission: v.transmissionName ?? '',
    bodyType: v.bodyTypeName ?? '',
    location: v.countryName ?? '',
    condition: v.condition ?? '',
    isFeatured: v.isFeatured ?? false,
    imageUrl: primaryImages.get(v.id),
    imageCount: imageCounts.get(v.id) ?? 0,
    stockId: v.stockNumber ?? undefined,
  }));
}

export async function getHomepageData(): Promise<HomepageData> {
  const [sections, featuredVehicles, latestVehicles] = await Promise.all([
    cmsRepo.listEnabledSections(),
    fetchVehiclesWithImages({ isFeatured: true, status: 'active' }, 28),
    fetchVehiclesWithImages({ status: 'active' }, 14),
  ]);

  return {
    sections: sections as HomepageSectionData[],
    featuredVehicles,
    latestVehicles,
  };
}
