'use server';

import { requireAuth } from '@/lib/auth';
import {
  VehicleService,
  CreateVehicleSchema,
  UpdateVehicleSchema,
  DomainError,
} from '@/server/services';
import { z } from 'zod';

const vehicleService = new VehicleService();

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

function handleError(error: unknown): { success: false; error: string; code?: string } {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }
  if (error instanceof DomainError) {
    return { success: false, error: error.message, code: error.code };
  }
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  };
}

const UUIDSchema = z.string().uuid('Invalid ID');

export async function createVehicle(
  data: z.infer<typeof CreateVehicleSchema>,
): Promise<ActionResult> {
  try {
    await requireAuth();
    const validated = CreateVehicleSchema.parse(data);
    const vehicle = await vehicleService.createVehicle(validated);
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateVehicle(
  id: string,
  data: z.infer<typeof UpdateVehicleSchema>,
): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(id);
    const validated = UpdateVehicleSchema.parse(data);
    const vehicle = await vehicleService.updateVehicle(id, validated);
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(id);
    await vehicleService.deleteVehicle(id);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function publishVehicle(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.updateVehicle(id, { status: 'active' });
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function archiveVehicle(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.updateVehicle(id, { status: 'archived' });
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function featureVehicle(
  id: string,
  featured: boolean,
): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.updateVehicle(id, { isFeatured: featured });
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadVehicleImages(
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult<{ paths: string[] }>> {
  try {
    await requireAuth();
    UUIDSchema.parse(vehicleId);

    const files = formData.getAll('images').filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return { success: false, error: 'No images provided', code: 'VALIDATION_ERROR' };
    }

    const paths = await vehicleService.uploadImages(vehicleId, files);
    return { success: true, data: { paths } };
  } catch (error) {
    return handleError(error);
  }
}
