import { VehicleRepository } from '@/server/repositories';
import { z } from 'zod';
import {
  ValidationError,
  VehicleNotFoundError,
} from './errors';
import { uploadFile, STORAGE_BUCKETS } from '@/lib/supabase/storage';

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
   * Adds an image record for a vehicle.
   */
  async addVehicleImage(vehicleId: string, imageUrl: string, sortOrder: number = 0) {
    if (!vehicleId) {
      throw new ValidationError('Vehicle ID is required');
    }
    if (!imageUrl) {
      throw new ValidationError('Image URL is required');
    }

    const existingVehicle = await this.vehicleRepo.findById(vehicleId);
    if (!existingVehicle) {
      throw new VehicleNotFoundError(vehicleId);
    }

    return this.vehicleRepo.addImage(vehicleId, imageUrl, sortOrder);
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
      const result = await uploadFile(STORAGE_BUCKETS.VEHICLE_IMAGES, path, buffer, {
        contentType: file.type,
      });

      await this.vehicleRepo.addImage(vehicleId, result.path, uploadedPaths.length);
      uploadedPaths.push(result.path);
    }

    return uploadedPaths;
  }
}
