import { z } from 'zod';

/**
 * Shared validation schemas for vehicle operations.
 * Used by both client components (form validation) and server actions/services.
 */
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
