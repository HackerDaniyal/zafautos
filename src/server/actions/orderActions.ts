'use server';

import { requireAuth } from '@/lib/auth';
import {
  OrderService,
  CreateOrderSchema,
  DomainError,
} from '@/server/services';
import { db } from '@/server/db/client';
import { auditLogs } from '@/server/db/schema';
import type { OrderListParams } from '@/lib/types/order';
import { z } from 'zod';

const orderService = new OrderService();

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

const OrderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

// ──────────────────────────────────────────────────────────────
// Existing Actions
// ──────────────────────────────────────────────────────────────

export async function createOrder(
  data: z.infer<typeof CreateOrderSchema>,
): Promise<ActionResult> {
  try {
    await requireAuth();
    const validated = CreateOrderSchema.parse(data);
    const order = await orderService.createOrder(validated);
    return { success: true, data: order };
  } catch (error) {
    return handleError(error);
  }
}

export async function listOrdersForAdmin(
  params: OrderListParams,
): Promise<ActionResult> {
  try {
    await requireAuth();
    const result = await orderService.listOrders(params);
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function getOrderDetail(orderId: string): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(orderId);
    const order = await orderService.getOrderDetail(orderId);
    return { success: true, data: order };
  } catch (error) {
    return handleError(error);
  }
}

export async function changeOrderStatus(
  orderId: string,
  status: string,
  note?: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(orderId);
    const validatedStatus = OrderStatusSchema.parse(status);
    const updated = await orderService.changeOrderStatus(
      orderId,
      validatedStatus,
      session.userId,
      note,
    );

    await db.insert(auditLogs).values({
      action: 'order.status_changed',
      entityType: 'order',
      entityId: orderId,
      userId: session.userId,
      changes: JSON.stringify({ status, note: note ?? null }),
    });

    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function addOrderNote(
  orderId: string,
  note: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(orderId);
    const createdNote = await orderService.addNote(orderId, note, session.userId);

    await db.insert(auditLogs).values({
      action: 'order.note_added',
      entityType: 'order',
      entityId: orderId,
      userId: session.userId,
      changes: JSON.stringify({ note }),
    });

    return { success: true, data: createdNote };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteOrderNote(noteId: string): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(noteId);
    const deleted = await orderService.deleteNote(noteId);
    return { success: true, data: deleted };
  } catch (error) {
    return handleError(error);
  }
}

export async function addOrderDocument(
  orderId: string,
  documentUrl: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(orderId);
    const createdDoc = await orderService.addDocument(
      orderId,
      documentUrl,
      session.userId,
    );

    await db.insert(auditLogs).values({
      action: 'order.document_added',
      entityType: 'order',
      entityId: orderId,
      userId: session.userId,
      changes: JSON.stringify({ documentUrl }),
    });

    return { success: true, data: createdDoc };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteOrderDocument(
  documentId: string,
): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(documentId);
    const deleted = await orderService.deleteDocument(documentId);
    return { success: true, data: deleted };
  } catch (error) {
    return handleError(error);
  }
}

export async function softDeleteOrder(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(orderId);
    const deleted = await orderService.softDeleteOrder(orderId, session.userId);

    await db.insert(auditLogs).values({
      action: 'order.soft_deleted',
      entityType: 'order',
      entityId: orderId,
      userId: session.userId,
      changes: JSON.stringify({ deleted: true }),
    });

    return { success: true, data: deleted };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreOrder(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(orderId);
    const restored = await orderService.restoreOrder(orderId);

    await db.insert(auditLogs).values({
      action: 'order.restored',
      entityType: 'order',
      entityId: orderId,
      userId: session.userId,
      changes: JSON.stringify({ restored: true }),
    });

    return { success: true, data: restored };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkUpdateOrderStatus(
  ids: string[],
  status: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    ids.forEach((id) => UUIDSchema.parse(id));
    const validatedStatus = OrderStatusSchema.parse(status);
    const results = await orderService.bulkUpdateStatus(
      ids,
      validatedStatus,
      session.userId,
    );
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkDeleteOrders(
  ids: string[],
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    ids.forEach((id) => UUIDSchema.parse(id));
    const results = await orderService.bulkDelete(ids, session.userId);
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function getOrderStats(): Promise<ActionResult> {
  try {
    await requireAuth();
    const stats = await orderService.getOrderStats();
    return { success: true, data: stats };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkRestoreOrders(ids: string[]): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    ids.forEach((id) => UUIDSchema.parse(id));
    const results = await Promise.all(ids.map((id) => orderService.restoreOrder(id)));
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function exportOrdersCsv(
  params: OrderListParams,
): Promise<ActionResult<string>> {
  try {
    await requireAuth();
    const result = await orderService.listOrders({ ...params, limit: 10000, page: 1 });
    const rows = result.data.map((row: Record<string, unknown>) => ({
      orderNumber: (row as { orderNumber?: string }).orderNumber,
      customer: (row as { customerName?: string }).customerName ?? '',
      dealer: (row as { dealerName?: string }).dealerName ?? '',
      vehicle: (row as { vehicleTitle?: string }).vehicleTitle ?? '',
      status: (row as { status?: string }).status ?? '',
      totalAmount: (row as { totalAmount?: number }).totalAmount ?? 0,
      createdAt: (row as { createdAt?: string }).createdAt ?? '',
    }));
    const headers = ['Order Number', 'Customer', 'Dealer', 'Vehicle', 'Status', 'Total', 'Created'];
    const csvRows = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `"${r.orderNumber}"`,
          `"${r.customer}"`,
          `"${r.dealer}"`,
          `"${r.vehicle}"`,
          `"${r.status}"`,
          r.totalAmount,
          `"${r.createdAt}"`,
        ].join(',')
      ),
    ];
    return { success: true, data: csvRows.join('\n') };
  } catch (error) {
    return handleError(error);
  }
}

export async function assignDealerToOrderAction(
  orderId: string,
  dealerId: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(orderId);
    UUIDSchema.parse(dealerId);
    const result = await orderService.assignDealer(
      orderId,
      dealerId,
      session.userId,
    );

    await db.insert(auditLogs).values({
      action: 'order.dealer_assigned',
      entityType: 'order',
      entityId: orderId,
      userId: session.userId,
      changes: JSON.stringify({ dealerId }),
    });

    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}
