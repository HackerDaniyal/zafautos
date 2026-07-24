import { VehicleRepository } from '@/server/repositories';
import { z } from 'zod';
import {
  ValidationError,
  VehicleNotFoundError,
} from './errors';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/supabase/storage';
import { vehicleImages } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import type { VehicleStatus } from '@/lib/types/vehicle';

export type { VehicleStatus } from '@/lib/types/vehicle';
import { vehicleStatus } from '@/server/db/schema';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Validation Schemas
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const CreateVehicleSchema = z.object({
  vin: z.string().optional().nullable(),
  stockNumber: z.string().optional().nullable(),
  manufacturerId: z.string().uuid('Invalid manufacturer ID').optional().nullable(),
  modelId: z.string().uuid('Invalid model ID').optional().nullable(),
  bodyTypeId: z.string().uuid('Invalid body type ID').optional().nullable(),
  fuelTypeId: z.string().uuid('Invalid fuel type ID').optional().nullable(),
  transmissionId: z.string().uuid('Invalid transmission ID').optional().nullable(),
  driveTypeId: z.string().uuid('Invalid drive type ID').optional().nullable(),
  colorId: z.string().uuid('Invalid color ID').optional().nullable(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  engineCc: z.number().int().positive().optional().nullable(),
  horsepower: z.number().int().positive().optional().nullable(),
  mileage: z.number().int().nonnegative().optional().nullable(),
  doors: z.number().int().positive().optional().nullable(),
  seats: z.number().int().positive().optional().nullable(),
  price: z.number().int().nonnegative().optional().nullable(),
  currencyId: z.string().uuid('Invalid currency ID').optional().nullable(),
  auctionGrade: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  countryId: z.string().uuid('Invalid country ID').optional().nullable(),
  portId: z.string().uuid('Invalid port ID').optional().nullable(),
  status: z.enum(['draft', 'active', 'sold', 'archived']).default('draft'),
  slug: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
});
export type CreateVehicleDTO = z.infer<typeof CreateVehicleSchema>;

export const UpdateVehicleSchema = CreateVehicleSchema.partial();
export type UpdateVehicleDTO = z.infer<typeof UpdateVehicleSchema>;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Service Layer
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class VehicleService {
  constructor(private readonly vehicleRepo: VehicleRepository = new VehicleRepository()) {}

  /**
   * Retrieves all vehicles.
   */
  async getAllVehicles() {
    return this.vehicleRepo.findAll();
  }

  /**
   * Retrieves only active vehicles.
   */
  async getActiveVehicles() {
    return this.vehicleRepo.findActive();
  }

  /**
   * Retrieves a vehicle by its ID.
   */
  async getVehicleById(id: string) {
    if (!id) {
      throw new ValidationError('Vehicle ID is required');
    }

    const vehicle = await this.vehicleRepo.findById(id);
    if (!vehicle) {
      throw new VehicleNotFoundError(id);
    }
    return vehicle;
  }

  /**
   * Retrieves a vehicle by its slug.
   */
  async getVehicleBySlug(slug: string) {
    if (!slug) {
      throw new ValidationError('Vehicle slug is required');
    }

    const vehicle = await this.vehicleRepo.findBySlug(slug);
    if (!vehicle) {
      throw new VehicleNotFoundError(slug);
    }
    return vehicle;
  }

  /**
   * Retrieves multiple vehicles by their IDs.
   */
  async getVehiclesByIds(ids: string[]) {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.vehicleRepo.findByIds(ids);
  }

  /**
   * Creates a new vehicle.
   */
  async createVehicle(data: CreateVehicleDTO) {
    const validatedData = CreateVehicleSchema.parse(data);

    // If VIN is provided, we might want to check for duplicates
    if (validatedData.vin) {
      // Find duplicate by checking if we have one with same VIN.
      // BaseRepository doesn't have findByVin by default, but we could fetch all and filter or add it to repo.
      // For now, if we assume db constraints handle it, we can just attempt insert.
      // Or we can add findByVin to repo later if needed.
    }

    return this.vehicleRepo.create(validatedData as unknown as Parameters<typeof this.vehicleRepo.create>[0]);
  }

  /**
   * Updates an existing vehicle.
   */
  async updateVehicle(id: string, data: UpdateVehicleDTO) {
    if (!id) {
      throw new ValidationError('Vehicle ID is required');
    }

    const validatedData = UpdateVehicleSchema.parse(data);
    const existingVehicle = await this.vehicleRepo.findById(id);

    if (!existingVehicle) {
      throw new VehicleNotFoundError(id);
    }

    const updated = await this.vehicleRepo.update(id, validatedData as unknown as Parameters<typeof this.vehicleRepo.update>[1]);
    if (!updated) {
      throw new VehicleNotFoundError(id);
    }

    return updated;
  }

  /**
   * Deletes a vehicle.
   */
  async deleteVehicle(id: string) {
    if (!id) {
      throw new ValidationError('Vehicle ID is required');
    }

    const existingVehicle = await this.vehicleRepo.findById(id);
    if (!existingVehicle) {
      throw new VehicleNotFoundError(id);
    }

    return this.vehicleRepo.delete(id);
  }

  /**
   * Uploads vehicle images and creates DB records.
   */
  async uploadImages(vehicleId: string, files: File[]): Promise<string[]> {
    if (!vehicleId) {
      throw new ValidationError('Vehicle ID is required');
    }
    if (!files || files.length === 0) {
      throw new ValidationError('At least one image is required');
    }

    const existingVehicle = await this.vehicleRepo.findById(vehicleId);
    if (!existingVehicle) {
      throw new VehicleNotFoundError(vehicleId);
    }

    const uploadedPaths: string[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${vehicleId}/${crypto.randomUUID()}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadFile(STORAGE_BUCKETS.vehicles, path, buffer, {
        contentType: file.type,
      });

      await this.vehicleRepo.addImage(vehicleId, result.path, uploadedPaths.length);
      uploadedPaths.push(result.path);
    }

    return uploadedPaths;
  }

  async softDeleteVehicle(id: string, deletedBy?: string) {
    if (!id) {
      throw new ValidationError('Vehicle ID is required');
    }

    const existingVehicle = await this.vehicleRepo.findById(id);
    if (!existingVehicle) {
      throw new VehicleNotFoundError(id);
    }

    return this.vehicleRepo.softDeleteVehicle(id, deletedBy);
  }

  async restoreVehicle(id: string) {
    if (!id) {
      throw new ValidationError('Vehicle ID is required');
    }

    const existingVehicle = await this.vehicleRepo.findById(id);
    if (!existingVehicle) {
      throw new VehicleNotFoundError(id);
    }

    return this.vehicleRepo.restoreVehicle(id);
  }

  async duplicateVehicle(id: string) {
    if (!id) {
      throw new ValidationError('Vehicle ID is required');
    }

    const existingVehicle = await this.vehicleRepo.findById(id);
    if (!existingVehicle) {
      throw new VehicleNotFoundError(id);
    }

    return this.vehicleRepo.duplicateVehicle(id);
  }

  async changeStatus(id: string, status: 'draft' | 'active' | 'sold' | 'archived', changedBy?: string, note?: string) {
    if (!id) {
      throw new ValidationError('Vehicle ID is required');
    }

    const existingVehicle = await this.vehicleRepo.findById(id);
    if (!existingVehicle) {
      throw new VehicleNotFoundError(id);
    }

    const updated = await this.vehicleRepo.updateStatus(id, status);
    if (!updated) {
      throw new VehicleNotFoundError(id);
    }

    const client = this.vehicleRepo.getClient();
    await client.insert(vehicleStatus).values({
      vehicleId: id,
      status,
      note: note || null,
      createdBy: changedBy ?? null,
    });

    return updated;
  }

  async toggleFeatured(id: string) {
    if (!id) {
      throw new ValidationError('Vehicle ID is required');
    }

    const existingVehicle = await this.vehicleRepo.findById(id);
    if (!existingVehicle) {
      throw new VehicleNotFoundError(id);
    }

    return this.vehicleRepo.toggleFeatured(id);
  }

  async bulkUpdateStatus(ids: string[], status: string) {
    if (!ids || ids.length === 0) {
      throw new ValidationError('At least one vehicle ID is required');
    }

    return this.vehicleRepo.bulkUpdateStatus(ids, status);
  }

  async bulkDelete(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new ValidationError('At least one vehicle ID is required');
    }

    return this.vehicleRepo.bulkDelete(ids);
  }

  async getVehicleWithImages(id: string) {
    if (!id) {
      throw new ValidationError('Vehicle ID is required');
    }

    const vehicle = await this.vehicleRepo.getVehicleWithImages(id);
    if (!vehicle) {
      throw new VehicleNotFoundError(id);
    }

    return vehicle;
  }

  async getVehicleImages(vehicleId: string) {
    if (!vehicleId) {
      throw new ValidationError('Vehicle ID is required');
    }

    return this.vehicleRepo.getVehicleImages(vehicleId);
  }

  async setPrimaryImage(vehicleId: string, imageId: string) {
    if (!vehicleId) {
      throw new ValidationError('Vehicle ID is required');
    }
    if (!imageId) {
      throw new ValidationError('Image ID is required');
    }

    const existingVehicle = await this.vehicleRepo.findById(vehicleId);
    if (!existingVehicle) {
      throw new VehicleNotFoundError(vehicleId);
    }

    return this.vehicleRepo.setPrimaryImage(vehicleId, imageId);
  }

  async deleteImage(imageId: string) {
    if (!imageId) {
      throw new ValidationError('Image ID is required');
    }

    return this.vehicleRepo.deleteImage(imageId);
  }

  async reorderImages(vehicleId: string, imageIds: string[]) {
    if (!vehicleId) {
      throw new ValidationError('Vehicle ID is required');
    }
    if (!imageIds || imageIds.length === 0) {
      throw new ValidationError('At least one image ID is required');
    }

    return this.vehicleRepo.reorderImages(vehicleId, imageIds);
  }

  async listVehicles(options: import('@/server/repositories/vehicleRepository').VehicleListOptions = {}) {
    return this.vehicleRepo.listWithRelations(options);
  }

  // ── Sub-entity CRUD ──────────────────────────────
  async listManufacturers() { return this.vehicleRepo.listManufacturers(); }
  async createManufacturer(data: { name: string; slug: string; countryId?: string; logoUrl?: string }) { return this.vehicleRepo.createManufacturer(data); }
  async updateManufacturer(id: string, data: { name?: string; slug?: string; countryId?: string | null; logoUrl?: string | null }) { return this.vehicleRepo.updateManufacturer(id, data); }
  async deleteManufacturer(id: string) { return this.vehicleRepo.deleteManufacturer(id); }

  async listModels() { return this.vehicleRepo.listModels(); }
  async createModel(data: { name: string; slug: string; manufacturerId?: string }) { return this.vehicleRepo.createModel(data); }
  async updateModel(id: string, data: { name?: string; slug?: string; manufacturerId?: string | null }) { return this.vehicleRepo.updateModel(id, data); }
  async deleteModel(id: string) { return this.vehicleRepo.deleteModel(id); }

  async listBodyTypes() { return this.vehicleRepo.listBodyTypes(); }
  async createBodyType(data: { name: string }) { return this.vehicleRepo.createBodyType(data); }
  async updateBodyType(id: string, data: { name: string }) { return this.vehicleRepo.updateBodyType(id, data); }
  async deleteBodyType(id: string) { return this.vehicleRepo.deleteBodyType(id); }

  async listFuelTypes() { return this.vehicleRepo.listFuelTypes(); }
  async createFuelType(data: { name: string }) { return this.vehicleRepo.createFuelType(data); }
  async updateFuelType(id: string, data: { name: string }) { return this.vehicleRepo.updateFuelType(id, data); }
  async deleteFuelType(id: string) { return this.vehicleRepo.deleteFuelType(id); }

  async listTransmissions() { return this.vehicleRepo.listTransmissions(); }
  async createTransmission(data: { name: string }) { return this.vehicleRepo.createTransmission(data); }
  async updateTransmission(id: string, data: { name: string }) { return this.vehicleRepo.updateTransmission(id, data); }
  async deleteTransmission(id: string) { return this.vehicleRepo.deleteTransmission(id); }

  async listDriveTypes() { return this.vehicleRepo.listDriveTypes(); }
  async createDriveType(data: { name: string }) { return this.vehicleRepo.createDriveType(data); }
  async updateDriveType(id: string, data: { name: string }) { return this.vehicleRepo.updateDriveType(id, data); }
  async deleteDriveType(id: string) { return this.vehicleRepo.deleteDriveType(id); }

  async listColors() { return this.vehicleRepo.listColors(); }
  async createColor(data: { name: string }) { return this.vehicleRepo.createColor(data); }
  async updateColor(id: string, data: { name: string }) { return this.vehicleRepo.updateColor(id, data); }
  async deleteColor(id: string) { return this.vehicleRepo.deleteColor(id); }

  async listCountries() { return this.vehicleRepo.listCountries(); }

  async bulkDuplicate(ids: string[]) { return this.vehicleRepo.bulkDuplicate(ids); }
  async bulkRestore(ids: string[]) { return this.vehicleRepo.bulkRestore(ids); }

  // ── Features/Specs/Docs ──────────────────────────
  async getVehicleFeatures(vehicleId: string) { return this.vehicleRepo.getVehicleFeatures(vehicleId); }
  async addVehicleFeature(vehicleId: string, name: string) { return this.vehicleRepo.addVehicleFeature(vehicleId, name); }
  async deleteVehicleFeature(featureId: string) { return this.vehicleRepo.deleteVehicleFeature(featureId); }

  async getVehicleSpecifications(vehicleId: string) { return this.vehicleRepo.getVehicleSpecifications(vehicleId); }
  async addVehicleSpecification(vehicleId: string, name: string, value: string) { return this.vehicleRepo.addVehicleSpecification(vehicleId, name, value); }
  async updateVehicleSpecification(specId: string, name: string, value: string) { return this.vehicleRepo.updateVehicleSpecification(specId, name, value); }
  async deleteVehicleSpecification(specId: string) { return this.vehicleRepo.deleteVehicleSpecification(specId); }

  async getVehicleDocuments(vehicleId: string) { return this.vehicleRepo.getVehicleDocuments(vehicleId); }
  async addVehicleDocument(vehicleId: string, documentUrl: string) { return this.vehicleRepo.addVehicleDocument(vehicleId, documentUrl); }
  async deleteVehicleDocument(docId: string) { return this.vehicleRepo.deleteVehicleDocument(docId); }

  async uploadVehicleDocument(vehicleId: string, file: File) {
    const { uploadFile, getPublicUrl } = await import('@/lib/supabase/storage');
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() ?? 'pdf';
    const filename = `${vehicleId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { path } = await uploadFile('documents', filename, buffer, { contentType: file.type });
    const documentUrl = getPublicUrl('documents', path);
    return this.vehicleRepo.addVehicleDocument(vehicleId, documentUrl);
  }

  async getVehicleStatusHistory(vehicleId: string) { return this.vehicleRepo.getVehicleStatusHistory(vehicleId); }
}
