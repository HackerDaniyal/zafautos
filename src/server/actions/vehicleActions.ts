'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import {
  VehicleService,
  ShippingService,
  CreateVehicleSchema,
  UpdateVehicleSchema,
} from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';
import { UUIDSchema } from '@/lib/validation/common';
import { z } from 'zod';
import type { VehicleStatus, VehicleListParams } from '@/lib/types/vehicle';
import type { LookupEntity } from '@/server/repositories/vehicleRepository';

const vehicleService = new VehicleService();
const shippingService = new ShippingService();
const auditService = new AuditService();

const LOOKUP_SINGULAR: Record<LookupEntity, string> = {
  manufacturer: 'make',
  model: 'model',
  bodyType: 'body type',
  fuelType: 'fuel type',
  transmission: 'transmission',
  driveType: 'drive type',
  color: 'color',
};

async function guardNoLinkedVehicles(entity: LookupEntity, id: string): Promise<ActionResult | null> {
  const counts = await vehicleService.countVehiclesByEntity(entity);
  const found = counts.find((c) => c.id === id);
  if (found && found.count > 0) {
    return {
      success: false,
      error: `Cannot delete this ${LOOKUP_SINGULAR[entity]}: ${found.count} vehicle(s) are linked to it. Reassign or remove those vehicles first.`,
      code: 'CONFLICT',
    };
  }
  return null;
}

function toSlug(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createVehicle(
  data: z.infer<typeof CreateVehicleSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.create');
    const validated = CreateVehicleSchema.parse(data);
    const vehicle = await vehicleService.createVehicle(validated);
    const v = vehicle as { id: string; vin?: string | null; stockNumber?: string | null };
    await auditService.logAction({
      action: 'vehicle.created',
      entityType: 'vehicle',
      entityId: v.id,
      entityLabel: v.vin ?? v.stockNumber ?? v.id,
    });
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
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(id);
    const validated = UpdateVehicleSchema.parse(data);
    const vehicle = await vehicleService.updateVehicle(id, validated);
    await auditService.logAction({
      action: 'vehicle.updated',
      entityType: 'vehicle',
      entityId: id,
      entityLabel: vehicle.vin ?? vehicle.stockNumber ?? id,
    });
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'vehicles.delete');
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.softDeleteVehicle(id, session.userId);
    await auditService.logAction({
      action: 'vehicle.deleted',
      entityType: 'vehicle',
      entityId: id,
      entityLabel: vehicle.vin ?? vehicle.stockNumber ?? id,
    });
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function publishVehicle(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'vehicles.update');
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.changeStatus(id, 'active', session.userId, 'Published');
    await auditService.logAction({
      action: 'vehicle.published',
      entityType: 'vehicle',
      entityId: id,
      entityLabel: vehicle.vin ?? vehicle.stockNumber ?? id,
    });
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function archiveVehicle(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'vehicles.update');
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.changeStatus(id, 'archived', session.userId, 'Archived');
    await auditService.logAction({
      action: 'vehicle.archived',
      entityType: 'vehicle',
      entityId: id,
      entityLabel: vehicle.vin ?? vehicle.stockNumber ?? id,
    });
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
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
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

export async function softDeleteVehicle(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'vehicles.delete');
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.softDeleteVehicle(id, session.userId);
    await auditService.logAction({
      action: 'vehicle.deleted',
      entityType: 'vehicle',
      entityId: id,
      metadata: { deletedAt: new Date().toISOString() },
    });
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreVehicle(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'vehicles.update');
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.restoreVehicle(id);
    await auditService.logAction({
      action: 'vehicle.restored',
      entityType: 'vehicle',
      entityId: id,
      metadata: { deletedAt: null },
    });
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function duplicateVehicle(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.create');
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.duplicateVehicle(id);
    if (vehicle) {
      await auditService.logAction({
        action: 'vehicle.duplicated',
        entityType: 'vehicle',
        entityId: id,
        entityLabel: `duplicated to ${vehicle.id}`,
      });
    }
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function changeVehicleStatus(
  id: string,
  status: VehicleStatus,
  note?: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'vehicles.update');
    UUIDSchema.parse(id);
    const oldVehicle = await vehicleService.getVehicleById(id);
    const oldStatus = (oldVehicle as Record<string, unknown>).status;
    const vehicle = await vehicleService.changeStatus(id, status, session.userId, note);
    await auditService.logAction({
      action: 'vehicle.status_changed',
      entityType: 'vehicle',
      entityId: id,
      metadata: { status: { from: oldStatus, to: status } },
    });
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function toggleVehicleFeatured(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.toggleFeatured(id);
    await auditService.logAction({
      action: 'vehicle.featured_toggled',
      entityType: 'vehicle',
      entityId: id,
      entityLabel: vehicle.vin ?? vehicle.stockNumber ?? id,
      metadata: { isFeatured: vehicle.isFeatured },
    });
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

const VEHICLE_STATUS_SCHEMA = z.enum(['draft', 'active', 'sold', 'archived']);

export async function bulkUpdateVehicleStatus(
  ids: string[],
  status: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'vehicles.update');
    const parsedStatus = VEHICLE_STATUS_SCHEMA.parse(status);
    for (const id of ids) {
      UUIDSchema.parse(id);
    }
    const result = await vehicleService.bulkUpdateStatus(ids, parsedStatus);
    await auditService.logAction({
      action: 'vehicle.bulk_status_changed',
      entityType: 'vehicle',
      entityId: ids.join(','),
      metadata: { status: parsedStatus, vehicleIds: ids },
    });
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkDeleteVehicles(ids: string[]): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'vehicles.delete');
    for (const id of ids) {
      UUIDSchema.parse(id);
    }
    const result = await vehicleService.bulkDelete(ids);
    await auditService.logAction({
      action: 'vehicle.bulk_deleted',
      entityType: 'vehicle',
      entityId: ids.join(','),
      metadata: { vehicleIds: ids },
    });
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function setVehiclePrimaryImage(
  vehicleId: string,
  imageId: string,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(vehicleId);
    UUIDSchema.parse(imageId);
    const image = await vehicleService.setPrimaryImage(vehicleId, imageId);
    return { success: true, data: image };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteVehicleImage(imageId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(imageId);
    const image = await vehicleService.deleteImage(imageId);
    if (image && typeof image === 'object' && 'imageUrl' in image && image.imageUrl) {
      try {
        const { deleteFile } = await import('@/lib/supabase/storage');
        const imageUrl = image.imageUrl as string;
        const path = imageUrl.split('/').slice(-2).join('/');
        if (path) await deleteFile('vehicles', [path]);
      } catch { /* Storage cleanup is best-effort */ }
    }
    return { success: true, data: image };
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderVehicleImages(
  vehicleId: string,
  imageIds: string[],
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(vehicleId);
    for (const imageId of imageIds) {
      UUIDSchema.parse(imageId);
    }
    await vehicleService.reorderImages(vehicleId, imageIds);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function getVehicleForEdit(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    UUIDSchema.parse(id);
    const vehicle = await vehicleService.getVehicleWithImages(id);
    return { success: true, data: vehicle };
  } catch (error) {
    return handleError(error);
  }
}

export async function listVehiclesForAdmin(
  params: VehicleListParams,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const result = await vehicleService.listVehicles({
      filters: {
        status: params.status,
        manufacturerId: params.manufacturerId,
        modelId: params.modelId,
        bodyTypeId: params.bodyTypeId,
        fuelTypeId: params.fuelTypeId,
        transmissionId: params.transmissionId,
        driveTypeId: params.driveTypeId,
        colorId: params.colorId,
        countryId: params.countryId,
        yearMin: params.yearMin,
        yearMax: params.yearMax,
        priceMin: params.priceMin,
        priceMax: params.priceMax,
        mileageMax: params.mileageMax,
        isFeatured: params.isFeatured,
        search: params.search,
      },
      pagination: {
        page: params.page,
        limit: params.limit,
      },
      sort: {
        column: params.sortColumn,
        direction: params.sortDirection,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function getVehicleStatsAction(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const data = await vehicleService.getVehicleStats();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

// ── Sub-entity CRUD Actions ──────────────────────
export async function listManufacturers(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const data = await vehicleService.listManufacturers();
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function createManufacturer(data: { name: string; slug?: string; countryId?: string; logoUrl?: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.create');
    if (!data.name?.trim()) return { success: false, error: 'Name is required', code: 'VALIDATION_ERROR' };
    const slug = data.slug || toSlug(data.name);
    const result = await vehicleService.createManufacturer({ ...data, slug });
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function updateManufacturer(id: string, data: { name?: string; slug?: string; countryId?: string | null; logoUrl?: string | null }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(id);
    const result = await vehicleService.updateManufacturer(id, data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function deleteManufacturer(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');
    UUIDSchema.parse(id);
    const guard = await guardNoLinkedVehicles('manufacturer', id);
    if (guard) return guard;
    await vehicleService.deleteManufacturer(id);
    return { success: true, data: undefined };
  } catch (error) { return handleError(error); }
}

export async function listModels(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const data = await vehicleService.listModels();
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function createModel(data: { name: string; slug?: string; manufacturerId?: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.create');
    if (!data.name?.trim()) return { success: false, error: 'Name is required', code: 'VALIDATION_ERROR' };
    const slug = data.slug || toSlug(data.name);
    const result = await vehicleService.createModel({ ...data, slug });
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function updateModel(id: string, data: { name?: string; slug?: string; manufacturerId?: string | null }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(id);
    const result = await vehicleService.updateModel(id, data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function deleteModel(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');
    UUIDSchema.parse(id);
    const guard = await guardNoLinkedVehicles('model', id);
    if (guard) return guard;
    await vehicleService.deleteModel(id);
    return { success: true, data: undefined };
  } catch (error) { return handleError(error); }
}

export async function listBodyTypes(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const data = await vehicleService.listBodyTypes();
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function createBodyType(data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.create');
    if (!data.name?.trim()) return { success: false, error: 'Name is required', code: 'VALIDATION_ERROR' };
    const result = await vehicleService.createBodyType(data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function updateBodyType(id: string, data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(id);
    const result = await vehicleService.updateBodyType(id, data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function deleteBodyType(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');
    UUIDSchema.parse(id);
    const guard = await guardNoLinkedVehicles('bodyType', id);
    if (guard) return guard;
    await vehicleService.deleteBodyType(id);
    return { success: true, data: undefined };
  } catch (error) { return handleError(error); }
}

export async function listFuelTypes(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const data = await vehicleService.listFuelTypes();
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function createFuelType(data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.create');
    if (!data.name?.trim()) return { success: false, error: 'Name is required', code: 'VALIDATION_ERROR' };
    const result = await vehicleService.createFuelType(data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function updateFuelType(id: string, data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(id);
    const result = await vehicleService.updateFuelType(id, data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function deleteFuelType(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');
    UUIDSchema.parse(id);
    const guard = await guardNoLinkedVehicles('fuelType', id);
    if (guard) return guard;
    await vehicleService.deleteFuelType(id);
    return { success: true, data: undefined };
  } catch (error) { return handleError(error); }
}

export async function listTransmissions(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const data = await vehicleService.listTransmissions();
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function createTransmission(data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.create');
    if (!data.name?.trim()) return { success: false, error: 'Name is required', code: 'VALIDATION_ERROR' };
    const result = await vehicleService.createTransmission(data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function updateTransmission(id: string, data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(id);
    const result = await vehicleService.updateTransmission(id, data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function deleteTransmission(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');
    UUIDSchema.parse(id);
    const guard = await guardNoLinkedVehicles('transmission', id);
    if (guard) return guard;
    await vehicleService.deleteTransmission(id);
    return { success: true, data: undefined };
  } catch (error) { return handleError(error); }
}

export async function listDriveTypes(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const data = await vehicleService.listDriveTypes();
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function createDriveType(data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.create');
    if (!data.name?.trim()) return { success: false, error: 'Name is required', code: 'VALIDATION_ERROR' };
    const result = await vehicleService.createDriveType(data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function updateDriveType(id: string, data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(id);
    const result = await vehicleService.updateDriveType(id, data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function deleteDriveType(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');
    UUIDSchema.parse(id);
    const guard = await guardNoLinkedVehicles('driveType', id);
    if (guard) return guard;
    await vehicleService.deleteDriveType(id);
    return { success: true, data: undefined };
  } catch (error) { return handleError(error); }
}

export async function listColors(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const data = await vehicleService.listColors();
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function createColor(data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.create');
    if (!data.name?.trim()) return { success: false, error: 'Name is required', code: 'VALIDATION_ERROR' };
    const result = await vehicleService.createColor(data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function updateColor(id: string, data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(id);
    const result = await vehicleService.updateColor(id, data);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function deleteColor(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');
    UUIDSchema.parse(id);
    const guard = await guardNoLinkedVehicles('color', id);
    if (guard) return guard;
    await vehicleService.deleteColor(id);
    return { success: true, data: undefined };
  } catch (error) { return handleError(error); }
}

export async function listCountries(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const data = await vehicleService.listCountries();
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

const LOOKUP_ENTITY_SCHEMA = z.enum([
  'manufacturer',
  'model',
  'bodyType',
  'fuelType',
  'transmission',
  'driveType',
  'color',
]);

export async function getVehicleLookupCounts(entity: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const parsed = LOOKUP_ENTITY_SCHEMA.parse(entity);
    const data = await vehicleService.countVehiclesByEntity(parsed);
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function listPorts(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    const result = await shippingService.listPorts();
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function getVehicleDetail(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    UUIDSchema.parse(id);
    const data = await vehicleService.getVehicleForDetail(id);
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function bulkDuplicateVehicles(ids: string[]): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.create');
    for (const id of ids) {
      UUIDSchema.parse(id);
    }
    const result = await vehicleService.bulkDuplicate(ids);
    await auditService.logAction({
      action: 'vehicle.bulk_duplicated',
      entityType: 'vehicle',
      entityId: ids.join(','),
      metadata: { vehicleIds: ids },
    });
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkRestoreVehicles(ids: string[]): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    for (const id of ids) {
      UUIDSchema.parse(id);
    }
    const result = await vehicleService.bulkRestore(ids);
    await auditService.logAction({
      action: 'vehicle.bulk_restored',
      entityType: 'vehicle',
      entityId: ids.join(','),
      metadata: { vehicleIds: ids },
    });
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

// ── Vehicle Features/Specs/Docs/Status Actions ────

export async function getVehicleFeaturesAction(vehicleId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    UUIDSchema.parse(vehicleId);
    const data = await vehicleService.getVehicleFeatures(vehicleId);
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function addVehicleFeatureAction(vehicleId: string, name: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(vehicleId);
    if (!name?.trim()) return { success: false, error: 'Feature name is required', code: 'VALIDATION_ERROR' };
    const result = await vehicleService.addVehicleFeature(vehicleId, name);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function deleteVehicleFeatureAction(featureId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');
    UUIDSchema.parse(featureId);
    await vehicleService.deleteVehicleFeature(featureId);
    return { success: true, data: undefined };
  } catch (error) { return handleError(error); }
}

export async function getVehicleSpecificationsAction(vehicleId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    UUIDSchema.parse(vehicleId);
    const data = await vehicleService.getVehicleSpecifications(vehicleId);
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function addVehicleSpecificationAction(vehicleId: string, name: string, value: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(vehicleId);
    if (!name?.trim()) return { success: false, error: 'Specification name is required', code: 'VALIDATION_ERROR' };
    const result = await vehicleService.addVehicleSpecification(vehicleId, name, value);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function updateVehicleSpecificationAction(specId: string, name: string, value: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(specId);
    const result = await vehicleService.updateVehicleSpecification(specId, name, value);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function deleteVehicleSpecificationAction(specId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');
    UUIDSchema.parse(specId);
    await vehicleService.deleteVehicleSpecification(specId);
    return { success: true, data: undefined };
  } catch (error) { return handleError(error); }
}

export async function getVehicleDocumentsAction(vehicleId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    UUIDSchema.parse(vehicleId);
    const data = await vehicleService.getVehicleDocuments(vehicleId);
    return { success: true, data };
  } catch (error) { return handleError(error); }
}

export async function addVehicleDocumentAction(vehicleId: string, documentUrl: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(vehicleId);
    if (!documentUrl?.trim()) return { success: false, error: 'Document URL is required', code: 'VALIDATION_ERROR' };
    const result = await vehicleService.addVehicleDocument(vehicleId, documentUrl);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function deleteVehicleDocumentAction(docId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');
    UUIDSchema.parse(docId);
    await vehicleService.deleteVehicleDocument(docId);
    return { success: true, data: undefined };
  } catch (error) { return handleError(error); }
}

export async function uploadVehicleDocumentFileAction(
  vehicleId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    UUIDSchema.parse(vehicleId);
    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) return { success: false, error: 'File is required', code: 'VALIDATION_ERROR' };
    const result = await vehicleService.uploadVehicleDocument(vehicleId, file);
    return { success: true, data: result };
  } catch (error) { return handleError(error); }
}

export async function getVehicleStatusHistoryAction(vehicleId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    UUIDSchema.parse(vehicleId);
    const data = await vehicleService.getVehicleStatusHistory(vehicleId);
    return { success: true, data };
  } catch (error) { return handleError(error); }
}
