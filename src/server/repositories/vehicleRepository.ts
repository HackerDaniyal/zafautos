import {
  vehicles,
  vehicleImages,
  manufacturers,
  models,
  bodyTypes,
  fuelTypes,
  transmissions,
  countries,
} from '@/server/db/schema';
import { eq, and, or, like, sql, desc, asc, type SQL } from 'drizzle-orm';
import { BaseRepository, type PaginatedResult, type PaginationOptions, type SortOptions } from './baseRepository';

export interface VehicleFilterOptions {
  manufacturerId?: string;
  modelId?: string;
  bodyTypeId?: string;
  fuelTypeId?: string;
  transmissionId?: string;
  countryId?: string;
  status?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  isFeatured?: boolean;
  search?: string;
}

export interface VehicleListOptions {
  filters?: VehicleFilterOptions;
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

export class VehicleRepository extends BaseRepository<typeof vehicles> {
  constructor() {
    super(vehicles);
  }

  async findBySlug(slug: string) {
    const [vehicle] = await this.getClient()
      .select()
      .from(vehicles)
      .where(eq(vehicles.slug, slug))
      .limit(1);

    return vehicle ?? null;
  }

  async findActive() {
    return this.getClient()
      .select()
      .from(vehicles)
      .where(eq(vehicles.status, 'active'));
  }

  async findByIds(ids: string[]) {
    return this.getClient()
      .select()
      .from(vehicles)
      .where(sql`${vehicles.id} = ANY(${ids})`);
  }

  async findFeatured(limit = 10) {
    return this.getClient()
      .select()
      .from(vehicles)
      .where(eq(vehicles.isFeatured, true))
      .limit(limit);
  }

  async findByManufacturer(manufacturerId: string) {
    return this.getClient()
      .select()
      .from(vehicles)
      .where(eq(vehicles.manufacturerId, manufacturerId));
  }

  async findActiveByStatus() {
    return this.findActive();
  }

  async getVehicleWithImages(vehicleId: string) {
    const [vehicle] = await this.getClient()
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, vehicleId))
      .limit(1);

    if (!vehicle) return null;

    const images = await this.getClient()
      .select()
      .from(vehicleImages)
      .where(eq(vehicleImages.vehicleId, vehicleId));

    return { ...vehicle, images };
  }

  async findBySlugWithRelations(slug: string) {
    const [vehicle] = await this.getClient()
      .select()
      .from(vehicles)
      .where(eq(vehicles.slug, slug))
      .limit(1);

    if (!vehicle) return null;

    const images = await this.getClient()
      .select()
      .from(vehicleImages)
      .where(eq(vehicleImages.vehicleId, vehicle.id));

    return { ...vehicle, images };
  }

  async listVehicles(options: VehicleListOptions = {}): Promise<PaginatedResult<typeof vehicles.$inferSelect>> {
    const { filters = {}, pagination = {}, sort = {} } = options;
    const { page = 1, limit = 20 } = pagination;
    const { column: sortCol = 'createdAt', direction = 'desc' } = sort;

    const conditions: SQL[] = [];

    // Always exclude soft-deleted
    conditions.push(sql`${vehicles.deletedAt} IS NULL`);

    // Status filter
    if (filters.status) {
      conditions.push(eq(vehicles.status, filters.status as 'draft' | 'active' | 'sold' | 'archived'));
    }

    // Relation filters
    if (filters.manufacturerId) conditions.push(eq(vehicles.manufacturerId, filters.manufacturerId));
    if (filters.modelId) conditions.push(eq(vehicles.modelId, filters.modelId));
    if (filters.bodyTypeId) conditions.push(eq(vehicles.bodyTypeId, filters.bodyTypeId));
    if (filters.fuelTypeId) conditions.push(eq(vehicles.fuelTypeId, filters.fuelTypeId));
    if (filters.transmissionId) conditions.push(eq(vehicles.transmissionId, filters.transmissionId));
    if (filters.countryId) conditions.push(eq(vehicles.countryId, filters.countryId));
    if (filters.isFeatured !== undefined) conditions.push(eq(vehicles.isFeatured, filters.isFeatured));

    // Numeric range filters
    if (filters.yearMin) conditions.push(sql`${vehicles.year} >= ${filters.yearMin}`);
    if (filters.yearMax) conditions.push(sql`${vehicles.year} <= ${filters.yearMax}`);
    if (filters.priceMin) conditions.push(sql`${vehicles.price} >= ${filters.priceMin}`);
    if (filters.priceMax) conditions.push(sql`${vehicles.price} <= ${filters.priceMax}`);
    if (filters.mileageMax) conditions.push(sql`${vehicles.mileage} <= ${filters.mileageMax}`);

    // Search across multiple text fields
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(vehicles.vin, searchTerm),
          like(vehicles.stockNumber, searchTerm),
          like(vehicles.auctionGrade, searchTerm),
          like(vehicles.condition, searchTerm),
        )!
      );
    }

    const whereClause = and(...conditions);

    // Count total
    const [{ count }] = await this.getClient()
      .select({ count: sql<number>`count(*)::int` })
      .from(vehicles)
      .where(whereClause);

    // Determine sort column — cast through SQLWrapper for type safety
    type VehicleCol = (typeof vehicles)[keyof typeof vehicles];
    const sortColumn = (vehicles[sortCol as keyof typeof vehicles] ?? vehicles.createdAt) as unknown as import('drizzle-orm').SQLWrapper;
    const sortFn = direction === 'asc' ? asc : desc;

    // Fetch data
    const data = await this.getClient()
      .select()
      .from(vehicles)
      .where(whereClause)
      .orderBy(sortFn(sortColumn))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      data,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getVehicleStats() {
    const [stats] = await this.getClient()
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${vehicles.status} = 'active')::int`,
        draft: sql<number>`count(*) filter (where ${vehicles.status} = 'draft')::int`,
        sold: sql<number>`count(*) filter (where ${vehicles.status} = 'sold')::int`,
        archived: sql<number>`count(*) filter (where ${vehicles.status} = 'archived')::int`,
        featured: sql<number>`count(*) filter (where ${vehicles.isFeatured} = true)::int`,
        avgPrice: sql<number>`coalesce(avg(${vehicles.price}), 0)::int`,
      })
      .from(vehicles)
      .where(sql`${vehicles.deletedAt} IS NULL`);

    return stats;
  }

  async addImage(vehicleId: string, imageUrl: string, sortOrder: number = 0) {
    const [image] = await this.getClient()
      .insert(vehicleImages)
      .values({ vehicleId, imageUrl, sortOrder })
      .returning();
    return image;
  }
}
