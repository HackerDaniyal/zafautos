'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import {
  ShippingService,
  CreateShipmentSchema,
} from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';
import { UUIDSchema } from '@/lib/validation/common';
import type { ShipmentStatus, ShippingListParams } from '@/lib/types/shipping';
import { z } from 'zod';

const shippingService = new ShippingService();
const auditService = new AuditService();

export async function createShipment(
  data: z.infer<typeof CreateShipmentSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.create');
    const validated = CreateShipmentSchema.parse(data);
    const shipment = await shippingService.createShipment(validated);

    await auditService.logAction({
      action: 'shipment.created',
      entityType: 'shipment',
      entityId: shipment.id as string,
      metadata: { carrier: validated.carrier, orderId: validated.orderId },
    });

    return { success: true, data: shipment };
  } catch (error) {
    return handleError(error);
  }
}

export async function getShipmentForEditAction(shipmentId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.read');
    UUIDSchema.parse(shipmentId);
    const shipment = await shippingService.getShipmentForEdit(shipmentId);
    return { success: true, data: shipment };
  } catch (error) {
    return handleError(error);
  }
}

export async function listShipments(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  orderId?: string;
  carrier?: string;
  dateFrom?: string;
  dateTo?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.read');
    const result = await shippingService.listShipments({
      ...params,
      status: params?.status as ShipmentStatus | undefined,
    });
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function getShipment(shipmentId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.read');
    const shipment = await shippingService.getShipmentDetail(shipmentId);
    return { success: true, data: shipment };
  } catch (error) {
    return handleError(error);
  }
}

export async function changeShipmentStatus(
  shipmentId: string,
  status: string,
  note?: string
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.update');
    await shippingService.changeShipmentStatus(
      shipmentId,
      status as 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled',
      undefined,
      note
    );

    await auditService.logAction({
      action: 'shipment.status_changed',
      entityType: 'shipment',
      entityId: shipmentId,
      metadata: { status, note: note ?? null },
    });

    return { success: true, data: { shipmentId, status } };
  } catch (error) {
    return handleError(error);
  }
}

export async function addShipmentNote(
  shipmentId: string,
  note: string
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.update');
    await shippingService.addNote(shipmentId, note);
    return { success: true, data: { shipmentId, note } };
  } catch (error) {
    return handleError(error);
  }
}

export async function addShipmentDocument(
  shipmentId: string,
  documentUrl: string,
  documentType?: string,
  documentName?: string,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.update');
    UUIDSchema.parse(shipmentId);
    await shippingService.addDocument(shipmentId, documentUrl, auth.userId, documentType, documentName);
    return { success: true, data: { shipmentId, documentUrl, documentType, documentName } };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteShipmentDocument(documentId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.update');
    await shippingService.deleteDocument(documentId);
    return { success: true, data: { documentId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function addShipmentContainer(
  shipmentId: string,
  containerNumber: string
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.update');
    await shippingService.addContainerByShipmentId(shipmentId, containerNumber);
    return { success: true, data: { shipmentId, containerNumber } };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteShipmentContainer(containerId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.update');
    await shippingService.deleteContainer(containerId);
    return { success: true, data: { containerId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteShipment(shipmentId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.delete');
    await shippingService.softDeleteShipment(shipmentId);

    await auditService.logAction({
      action: 'shipment.soft_deleted',
      entityType: 'shipment',
      entityId: shipmentId,
      metadata: { deleted: true },
    });

    return { success: true, data: { shipmentId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreShipment(shipmentId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.update');
    await shippingService.restoreShipment(shipmentId);

    await auditService.logAction({
      action: 'shipment.restored',
      entityType: 'shipment',
      entityId: shipmentId,
      metadata: { restored: true },
    });

    return { success: true, data: { shipmentId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkUpdateShipmentStatus(
  ids: string[],
  status: string
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.update');
    const results = await shippingService.bulkUpdateStatus(
      ids,
      status as 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled'
    );
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkDeleteShipments(ids: string[]): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.delete');
    const results = await shippingService.bulkDelete(ids);
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function getShippingStats(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.read');
    const stats = await shippingService.getShipmentStats();
    return { success: true, data: stats };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateShipment(
  shipmentId: string,
  data: {
    carrier?: string;
    orderId?: string;
    trackingNumber?: string;
    vessel?: string;
    bookingReference?: string;
    shippingCost?: number;
    originPortId?: string | null;
    destinationPortId?: string | null;
    estimatedDeparture?: Date | null;
    estimatedArrival?: Date | null;
    actualDeparture?: Date | null;
    actualArrival?: Date | null;
  },
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'shipping.update');
    UUIDSchema.parse(shipmentId);
    const updated = await shippingService.updateShipment(shipmentId, data, session.userId);

    await auditService.logAction({
      action: 'shipment.updated',
      entityType: 'shipment',
      entityId: shipmentId,
      metadata: { changes: data },
    });

    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function exportShipmentsCsv(
  params: ShippingListParams,
): Promise<ActionResult<string>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'shipping.read');
    const result = await shippingService.listShipments({ ...params, limit: 10000, page: 1 });
    const rows = result.data.map((row: Record<string, unknown>) => ({
      carrier: (row as { carrier?: string }).carrier ?? '',
      orderNumber: (row as { orderNumber?: string }).orderNumber ?? '',
      status: (row as { status?: string }).status ?? '',
      containers: (row as { containerCount?: number }).containerCount ?? 0,
      trackingEvents: (row as { trackingCount?: number }).trackingCount ?? 0,
      createdAt: (row as { createdAt?: string }).createdAt ?? '',
    }));
    const headers = ['Carrier', 'Order Number', 'Status', 'Containers', 'Tracking Events', 'Created'];
    const csvRows = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `"${r.carrier}"`,
          `"${r.orderNumber}"`,
          `"${r.status}"`,
          r.containers,
          r.trackingEvents,
          `"${r.createdAt}"`,
        ].join(',')
      ),
    ];
    return { success: true, data: csvRows.join('\n') };
  } catch (error) {
    return handleError(error);
  }
}
