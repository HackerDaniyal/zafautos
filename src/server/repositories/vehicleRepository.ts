import {
  vehicles,
  vehicleImages,
  manufacturers,
  models,
  bodyTypes,
  fuelTypes,
  transmissions,
  colors,
  driveTypes,
  vehicleFeatures,
  vehicleSpecifications,
  vehicleDocuments,
  vehicleStatus,
  countries,
  currencies,
  ports,
} from '@/server/db/schema';

export type LookupEntity =
  | 'manufacturer'
  | 'model'
  | 'bodyType'
  | 'fuelType'
  | 'transmission'
  | 'driveType'
  | 'color';
import { eq, and, or, like, sql, desc, asc, inArray, type SQL } from 'drizzle-orm';
import { BaseRepository, type PaginatedResult, type PaginationOptions, type SortOptions } from './baseRepository';

export interface VehicleFilterOptions {
  manufacturerId?: string;
  modelId?: string;
  bodyTypeId?: string;
  fuelTypeId?: string;
  transmissionId?: string;
  driveTypeId?: string;
  colorId?: string;
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
      .where(inArray(vehicles.id, ids));
  }

  async getVehicleWithImages(vehicleId: string) {
    const [[vehicle], images] = await Promise.all([
      this.getClient()
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId))
        .limit(1),
      this.getClient()
        .select()
        .from(vehicleImages)
        .where(eq(vehicleImages.vehicleId, vehicleId)),
    ]);

    if (!vehicle) return null;

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
    if (filters.driveTypeId) conditions.push(eq(vehicles.driveTypeId, filters.driveTypeId));
    if (filters.colorId) conditions.push(eq(vehicles.colorId, filters.colorId));
    if (filters.countryId) conditions.push(eq(vehicles.countryId, filters.countryId));
    if (filters.isFeatured !== undefined) conditions.push(eq(vehicles.isFeatured, filters.isFeatured));

    // Numeric range filters
    if (filters.yearMin) conditions.push(sql`${vehicles.year} >= ${filters.yearMin}`);
    if (filters.yearMax) conditions.push(sql`${vehicles.year} <= ${filters.yearMax}`);
    if (filters.priceMin) conditions.push(sql`${vehicles.price} >= ${filters.priceMin}`);
    if (filters.priceMax) conditions.push(sql`${vehicles.price} <= ${filters.priceMax}`);
    if (filters.mileageMax) conditions.push(sql`${vehicles.mileage} <= ${filters.mileageMax}`);

    // Search across multiple text fields including make/model names
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      const baseConditions: SQL[] = [
        or(
          like(vehicles.vin, searchTerm),
          like(vehicles.stockNumber, searchTerm),
          like(vehicles.auctionGrade, searchTerm),
          like(vehicles.condition, searchTerm),
        )!,
      ];

      // Also search by manufacturer name
      const matchingManufacturerIds = this.getClient()
        .select({ id: manufacturers.id })
        .from(manufacturers)
        .where(and(like(manufacturers.name, searchTerm), sql`${manufacturers.deletedAt} IS NULL`));

      // Also search by model name
      const matchingModelIds = this.getClient()
        .select({ id: models.id })
        .from(models)
        .where(and(like(models.name, searchTerm), sql`${models.deletedAt} IS NULL`));

      baseConditions.push(
        or(
          inArray(vehicles.manufacturerId, matchingManufacturerIds),
          inArray(vehicles.modelId, matchingModelIds),
        )!
      );

      conditions.push(or(...baseConditions)!);
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

  async softDeleteVehicle(id: string, deletedBy?: string) {
    const [updated] = await this.getClient()
      .update(vehicles)
      .set({
        deletedAt: new Date(),
        deletedBy: deletedBy ?? null,
      })
      .where(eq(vehicles.id, id))
      .returning();
    return updated;
  }

  async restoreVehicle(id: string) {
    const [updated] = await this.getClient()
      .update(vehicles)
      .set({
        deletedAt: null,
        deletedBy: null,
      })
      .where(eq(vehicles.id, id))
      .returning();
    return updated;
  }

  async duplicateVehicle(id: string) {
    const [vehicle] = await this.getClient()
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (!vehicle) return null;

    const images = await this.getClient()
      .select()
      .from(vehicleImages)
      .where(eq(vehicleImages.vehicleId, id));

    const { id: _, vin: _vin, stockNumber: _stock, slug: _slug, createdAt: _c, updatedAt: _u, deletedAt: _da, deletedBy: _db, ...rest } = vehicle;

    return this.getClient().transaction(async (tx) => {
      const [newVehicle] = await tx
        .insert(vehicles)
        .values({
          ...rest,
          vin: null,
          stockNumber: null,
          slug: null,
          status: 'draft',
          isFeatured: false,
        })
        .returning();

      if (newVehicle && images.length > 0) {
        await tx
          .insert(vehicleImages)
          .values(
            images.map((img) => ({
              vehicleId: newVehicle.id,
              imageUrl: img.imageUrl,
              sortOrder: img.sortOrder,
              isPrimary: img.isPrimary,
            }))
          );
      }

      return newVehicle;
    });
  }

  async updateStatus(id: string, status: 'draft' | 'active' | 'sold' | 'archived') {
    const [updated] = await this.getClient()
      .update(vehicles)
      .set({ status })
      .where(eq(vehicles.id, id))
      .returning();
    return updated;
  }

  async toggleFeatured(id: string) {
    const [updated] = await this.getClient()
      .update(vehicles)
      .set({ isFeatured: sql`NOT ${vehicles.isFeatured}` })
      .where(eq(vehicles.id, id))
      .returning();
    return updated;
  }

  async bulkUpdateStatus(ids: string[], status: string) {
    return this.getClient()
      .update(vehicles)
      .set({ status: status as 'draft' | 'active' | 'sold' | 'archived' })
      .where(inArray(vehicles.id, ids))
      .returning();
  }

  async bulkDelete(ids: string[]) {
    return this.getClient()
      .update(vehicles)
      .set({ deletedAt: new Date(), deletedBy: null })
      .where(inArray(vehicles.id, ids))
      .returning();
  }

  async getVehicleImages(vehicleId: string) {
    return this.getClient()
      .select()
      .from(vehicleImages)
      .where(eq(vehicleImages.vehicleId, vehicleId));
  }

  async setPrimaryImage(vehicleId: string, imageId: string) {
    return this.getClient().transaction(async (tx) => {
      await tx
        .update(vehicleImages)
        .set({ isPrimary: false })
        .where(eq(vehicleImages.vehicleId, vehicleId));

      const [updated] = await tx
        .update(vehicleImages)
        .set({ isPrimary: true })
        .where(eq(vehicleImages.id, imageId))
        .returning();
      return updated;
    });
  }

  async deleteImage(imageId: string) {
    const [deleted] = await this.getClient()
      .delete(vehicleImages)
      .where(eq(vehicleImages.id, imageId))
      .returning();
    return deleted;
  }

  async reorderImages(vehicleId: string, imageIds: string[]) {
    return this.getClient().transaction(async (tx) => {
      for (let i = 0; i < imageIds.length; i++) {
        await tx
          .update(vehicleImages)
          .set({ sortOrder: i })
          .where(
            and(
              eq(vehicleImages.vehicleId, vehicleId),
              eq(vehicleImages.id, imageIds[i]),
            )
          );
      }
    });
  }

  async listWithRelations(options: VehicleListOptions = {}): Promise<PaginatedResult<typeof vehicles.$inferSelect & { _manufacturerName: string | null; _modelName: string | null; _bodyTypeName: string | null; _fuelTypeName: string | null; _transmissionTypeName: string | null; _countryName: string | null }>> {
    const result = await this.listVehicles(options);

    const manufacturerIds = [...new Set(result.data.map((v) => v.manufacturerId).filter(Boolean))] as string[];
    const modelIds = [...new Set(result.data.map((v) => v.modelId).filter(Boolean))] as string[];
    const bodyTypeIds = [...new Set(result.data.map((v) => v.bodyTypeId).filter(Boolean))] as string[];
    const fuelTypeIds = [...new Set(result.data.map((v) => v.fuelTypeId).filter(Boolean))] as string[];
    const transmissionIds = [...new Set(result.data.map((v) => v.transmissionId).filter(Boolean))] as string[];
    const countryIds = [...new Set(result.data.map((v) => v.countryId).filter(Boolean))] as string[];

    const [manufacturersData, modelsData, bodyTypesData, fuelTypesData, transmissionsData, countriesData] = await Promise.all([
      manufacturerIds.length > 0
        ? this.getClient().select().from(manufacturers).where(inArray(manufacturers.id, manufacturerIds))
        : Promise.resolve([]),
      modelIds.length > 0
        ? this.getClient().select().from(models).where(inArray(models.id, modelIds))
        : Promise.resolve([]),
      bodyTypeIds.length > 0
        ? this.getClient().select().from(bodyTypes).where(inArray(bodyTypes.id, bodyTypeIds))
        : Promise.resolve([]),
      fuelTypeIds.length > 0
        ? this.getClient().select().from(fuelTypes).where(inArray(fuelTypes.id, fuelTypeIds))
        : Promise.resolve([]),
      transmissionIds.length > 0
        ? this.getClient().select().from(transmissions).where(inArray(transmissions.id, transmissionIds))
        : Promise.resolve([]),
      countryIds.length > 0
        ? this.getClient().select().from(countries).where(inArray(countries.id, countryIds))
        : Promise.resolve([]),
    ]);

    const manufacturerMap = new Map(manufacturersData.map((m) => [m.id, m.name]));
    const modelMap = new Map(modelsData.map((m) => [m.id, m.name]));
    const bodyTypeMap = new Map(bodyTypesData.map((b) => [b.id, b.name]));
    const fuelTypeMap = new Map(fuelTypesData.map((f) => [f.id, f.name]));
    const transmissionMap = new Map(transmissionsData.map((t) => [t.id, t.name]));
    const countryMap = new Map(countriesData.map((c) => [c.id, c.name]));

    const enriched = result.data.map((v) => ({
      ...v,
      _manufacturerName: v.manufacturerId ? (manufacturerMap.get(v.manufacturerId) ?? null) : null,
      _modelName: v.modelId ? (modelMap.get(v.modelId) ?? null) : null,
      _bodyTypeName: v.bodyTypeId ? (bodyTypeMap.get(v.bodyTypeId) ?? null) : null,
      _fuelTypeName: v.fuelTypeId ? (fuelTypeMap.get(v.fuelTypeId) ?? null) : null,
      _transmissionTypeName: v.transmissionId ? (transmissionMap.get(v.transmissionId) ?? null) : null,
      _countryName: v.countryId ? (countryMap.get(v.countryId) ?? null) : null,
    }));

    return { ...result, data: enriched };
  }

  // ── Lookup vehicle counts ───────────────────────
  private static readonly LOOKUP_COUNT_COLUMN_NAMES: Record<LookupEntity, string> = {
    manufacturer: 'manufacturer_id',
    model: 'model_id',
    bodyType: 'body_type_id',
    fuelType: 'fuel_type_id',
    transmission: 'transmission_id',
    driveType: 'drive_type_id',
    color: 'color_id',
  };

  async countVehiclesByEntity(entity: LookupEntity): Promise<{ id: string; count: number }[]> {
    const columnName = VehicleRepository.LOOKUP_COUNT_COLUMN_NAMES[entity];
    const col = sql`${sql.identifier(columnName)}`;
    const rows = await this.getClient()
      .select({ id: sql<string>`${col}`, count: sql<number>`count(*)::int` })
      .from(vehicles)
      .where(and(sql`${col} IS NOT NULL`, sql`${vehicles.deletedAt} IS NULL`))
      .groupBy(col);
    return rows as { id: string; count: number }[];
  }

  async getVehicleRelations(id: string): Promise<Record<string, string | null> | null> {
    const [vehicle] = await this.getClient()
      .select({
        manufacturerId: vehicles.manufacturerId,
        modelId: vehicles.modelId,
        bodyTypeId: vehicles.bodyTypeId,
        fuelTypeId: vehicles.fuelTypeId,
        transmissionId: vehicles.transmissionId,
        driveTypeId: vehicles.driveTypeId,
        colorId: vehicles.colorId,
        countryId: vehicles.countryId,
        currencyId: vehicles.currencyId,
        portId: vehicles.portId,
      })
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (!vehicle) return null;

    const [man, mod, body, fuel, trans, drive, color, country, currency, port] = await Promise.all([
      vehicle.manufacturerId ? this.getClient().select({ name: manufacturers.name }).from(manufacturers).where(eq(manufacturers.id, vehicle.manufacturerId)).limit(1) : Promise.resolve([]),
      vehicle.modelId ? this.getClient().select({ name: models.name }).from(models).where(eq(models.id, vehicle.modelId)).limit(1) : Promise.resolve([]),
      vehicle.bodyTypeId ? this.getClient().select({ name: bodyTypes.name }).from(bodyTypes).where(eq(bodyTypes.id, vehicle.bodyTypeId)).limit(1) : Promise.resolve([]),
      vehicle.fuelTypeId ? this.getClient().select({ name: fuelTypes.name }).from(fuelTypes).where(eq(fuelTypes.id, vehicle.fuelTypeId)).limit(1) : Promise.resolve([]),
      vehicle.transmissionId ? this.getClient().select({ name: transmissions.name }).from(transmissions).where(eq(transmissions.id, vehicle.transmissionId)).limit(1) : Promise.resolve([]),
      vehicle.driveTypeId ? this.getClient().select({ name: driveTypes.name }).from(driveTypes).where(eq(driveTypes.id, vehicle.driveTypeId)).limit(1) : Promise.resolve([]),
      vehicle.colorId ? this.getClient().select({ name: colors.name }).from(colors).where(eq(colors.id, vehicle.colorId)).limit(1) : Promise.resolve([]),
      vehicle.countryId ? this.getClient().select({ name: countries.name }).from(countries).where(eq(countries.id, vehicle.countryId)).limit(1) : Promise.resolve([]),
      vehicle.currencyId ? this.getClient().select({ code: currencies.code, name: currencies.name }).from(currencies).where(eq(currencies.id, vehicle.currencyId)).limit(1) : Promise.resolve([]),
      vehicle.portId ? this.getClient().select({ name: ports.name }).from(ports).where(eq(ports.id, vehicle.portId)).limit(1) : Promise.resolve([]),
    ]);

    return {
      manufacturerName: man[0]?.name ?? null,
      modelName: mod[0]?.name ?? null,
      bodyTypeName: body[0]?.name ?? null,
      fuelTypeName: fuel[0]?.name ?? null,
      transmissionName: trans[0]?.name ?? null,
      driveTypeName: drive[0]?.name ?? null,
      colorName: color[0]?.name ?? null,
      countryName: country[0]?.name ?? null,
      currencyCode: currency[0]?.code ?? null,
      currencyName: currency[0]?.name ?? null,
      portName: port[0]?.name ?? null,
    };
  }

  // ── Sub-entity CRUD ──────────────────────────────
  async listManufacturers() {
    return this.getClient().select().from(manufacturers).where(sql`${manufacturers.deletedAt} IS NULL`).orderBy(asc(manufacturers.name));
  }

  async createManufacturer(data: { name: string; slug: string; countryId?: string; logoUrl?: string }) {
    const [result] = await this.getClient().insert(manufacturers).values(data).returning();
    return result;
  }

  async updateManufacturer(id: string, data: { name?: string; slug?: string; countryId?: string | null; logoUrl?: string | null }) {
    const [result] = await this.getClient().update(manufacturers).set({ ...data, updatedAt: new Date() }).where(eq(manufacturers.id, id)).returning();
    return result ?? null;
  }

  async deleteManufacturer(id: string) {
    await this.getClient().update(manufacturers).set({ deletedAt: new Date() }).where(eq(manufacturers.id, id));
  }

  async listModels() {
    return this.getClient().select().from(models).where(sql`${models.deletedAt} IS NULL`).orderBy(asc(models.name));
  }

  async createModel(data: { name: string; slug: string; manufacturerId?: string }) {
    const [result] = await this.getClient().insert(models).values(data).returning();
    return result;
  }

  async updateModel(id: string, data: { name?: string; slug?: string; manufacturerId?: string | null }) {
    const [result] = await this.getClient().update(models).set({ ...data, updatedAt: new Date() }).where(eq(models.id, id)).returning();
    return result ?? null;
  }

  async deleteModel(id: string) {
    await this.getClient().update(models).set({ deletedAt: new Date() }).where(eq(models.id, id));
  }

  async listBodyTypes() {
    return this.getClient().select().from(bodyTypes).where(sql`${bodyTypes.deletedAt} IS NULL`).orderBy(asc(bodyTypes.name));
  }

  async createBodyType(data: { name: string }) {
    const [result] = await this.getClient().insert(bodyTypes).values(data).returning();
    return result;
  }

  async updateBodyType(id: string, data: { name: string }) {
    const [result] = await this.getClient().update(bodyTypes).set({ ...data, updatedAt: new Date() }).where(eq(bodyTypes.id, id)).returning();
    return result ?? null;
  }

  async deleteBodyType(id: string) {
    await this.getClient().update(bodyTypes).set({ deletedAt: new Date() }).where(eq(bodyTypes.id, id));
  }

  async listFuelTypes() {
    return this.getClient().select().from(fuelTypes).where(sql`${fuelTypes.deletedAt} IS NULL`).orderBy(asc(fuelTypes.name));
  }

  async createFuelType(data: { name: string }) {
    const [result] = await this.getClient().insert(fuelTypes).values(data).returning();
    return result;
  }

  async updateFuelType(id: string, data: { name: string }) {
    const [result] = await this.getClient().update(fuelTypes).set({ ...data, updatedAt: new Date() }).where(eq(fuelTypes.id, id)).returning();
    return result ?? null;
  }

  async deleteFuelType(id: string) {
    await this.getClient().update(fuelTypes).set({ deletedAt: new Date() }).where(eq(fuelTypes.id, id));
  }

  async listTransmissions() {
    return this.getClient().select().from(transmissions).where(sql`${transmissions.deletedAt} IS NULL`).orderBy(asc(transmissions.name));
  }

  async createTransmission(data: { name: string }) {
    const [result] = await this.getClient().insert(transmissions).values(data).returning();
    return result;
  }

  async updateTransmission(id: string, data: { name: string }) {
    const [result] = await this.getClient().update(transmissions).set({ ...data, updatedAt: new Date() }).where(eq(transmissions.id, id)).returning();
    return result ?? null;
  }

  async deleteTransmission(id: string) {
    await this.getClient().update(transmissions).set({ deletedAt: new Date() }).where(eq(transmissions.id, id));
  }

  async listDriveTypes() {
    return this.getClient().select().from(driveTypes).where(sql`${driveTypes.deletedAt} IS NULL`).orderBy(asc(driveTypes.name));
  }

  async createDriveType(data: { name: string }) {
    const [result] = await this.getClient().insert(driveTypes).values(data).returning();
    return result;
  }

  async updateDriveType(id: string, data: { name: string }) {
    const [result] = await this.getClient().update(driveTypes).set({ ...data, updatedAt: new Date() }).where(eq(driveTypes.id, id)).returning();
    return result ?? null;
  }

  async deleteDriveType(id: string) {
    await this.getClient().update(driveTypes).set({ deletedAt: new Date() }).where(eq(driveTypes.id, id));
  }

  async listColors() {
    return this.getClient().select().from(colors).where(sql`${colors.deletedAt} IS NULL`).orderBy(asc(colors.name));
  }

  async createColor(data: { name: string }) {
    const [result] = await this.getClient().insert(colors).values(data).returning();
    return result;
  }

  async updateColor(id: string, data: { name: string }) {
    const [result] = await this.getClient().update(colors).set({ ...data, updatedAt: new Date() }).where(eq(colors.id, id)).returning();
    return result ?? null;
  }

  async deleteColor(id: string) {
    await this.getClient().update(colors).set({ deletedAt: new Date() }).where(eq(colors.id, id));
  }

  // ── Vehicle Features/Specs/Docs ──────────────────
  async getVehicleFeatures(vehicleId: string) {
    return this.getClient().select().from(vehicleFeatures).where(and(eq(vehicleFeatures.vehicleId, vehicleId), sql`${vehicleFeatures.deletedAt} IS NULL`));
  }

  async addVehicleFeature(vehicleId: string, name: string) {
    const [result] = await this.getClient().insert(vehicleFeatures).values({ vehicleId, name }).returning();
    return result;
  }

  async deleteVehicleFeature(featureId: string) {
    await this.getClient().update(vehicleFeatures).set({ deletedAt: new Date() }).where(eq(vehicleFeatures.id, featureId));
  }

  async getVehicleSpecifications(vehicleId: string) {
    return this.getClient().select().from(vehicleSpecifications).where(and(eq(vehicleSpecifications.vehicleId, vehicleId), sql`${vehicleSpecifications.deletedAt} IS NULL`));
  }

  async addVehicleSpecification(vehicleId: string, name: string, value: string) {
    const [result] = await this.getClient().insert(vehicleSpecifications).values({ vehicleId, name, value }).returning();
    return result;
  }

  async updateVehicleSpecification(specId: string, name: string, value: string) {
    const [result] = await this.getClient().update(vehicleSpecifications).set({ name, value, updatedAt: new Date() }).where(eq(vehicleSpecifications.id, specId)).returning();
    return result ?? null;
  }

  async deleteVehicleSpecification(specId: string) {
    await this.getClient().update(vehicleSpecifications).set({ deletedAt: new Date() }).where(eq(vehicleSpecifications.id, specId));
  }

  async getVehicleDocuments(vehicleId: string) {
    return this.getClient().select().from(vehicleDocuments).where(and(eq(vehicleDocuments.vehicleId, vehicleId), sql`${vehicleDocuments.deletedAt} IS NULL`));
  }

  async addVehicleDocument(vehicleId: string, documentUrl: string) {
    const [result] = await this.getClient().insert(vehicleDocuments).values({ vehicleId, documentUrl }).returning();
    return result;
  }

  async deleteVehicleDocument(docId: string) {
    await this.getClient().update(vehicleDocuments).set({ deletedAt: new Date() }).where(eq(vehicleDocuments.id, docId));
  }

  async listCountries() {
    return this.getClient().select().from(countries).where(sql`${countries.deletedAt} IS NULL AND ${countries.isActive} = true`).orderBy(asc(countries.name));
  }

  async bulkDuplicate(ids: string[]) {
    return this.getClient().transaction(async (tx) => {
      const results = [];
      for (const id of ids) {
        const [vehicle] = await tx.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
        if (!vehicle) continue;

        const images = await tx.select().from(vehicleImages).where(eq(vehicleImages.vehicleId, id));

        const { id: _, vin: _vin, stockNumber: _stock, slug: _slug, createdAt: _c, updatedAt: _u, deletedAt: _da, deletedBy: _db, ...rest } = vehicle;

        const [newVehicle] = await tx
          .insert(vehicles)
          .values({
            ...rest,
            vin: null,
            stockNumber: null,
            slug: null,
            status: 'draft',
            isFeatured: false,
          })
          .returning();

        if (newVehicle && images.length > 0) {
          await tx.insert(vehicleImages).values(
            images.map((img) => ({
              vehicleId: newVehicle.id,
              imageUrl: img.imageUrl,
              sortOrder: img.sortOrder,
              isPrimary: img.isPrimary,
            }))
          );
        }

        results.push(newVehicle);
      }
      return results;
    });
  }

  async bulkRestore(ids: string[]) {
    return this.getClient()
      .update(vehicles)
      .set({ deletedAt: null, deletedBy: null })
      .where(inArray(vehicles.id, ids))
      .returning();
  }

  async getVehicleStatusHistory(vehicleId: string) {
    return this.getClient().select().from(vehicleStatus).where(eq(vehicleStatus.vehicleId, vehicleId)).orderBy(desc(vehicleStatus.createdAt));
  }
}
