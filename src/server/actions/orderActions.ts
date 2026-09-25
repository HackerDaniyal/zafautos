'use server';

import { requireAuth } from '@/lib/auth';
import type { AuthContext } from '@/lib/auth';
import { hasMinRole, requirePermission } from '@/lib/auth/rbac';
import {
  assertOrderAccess,
  loadOrderDocumentOrderId,
  loadOrderNoteOrderId,
  resolveCustomerRecordId,
  resolveDealerRecordId,
  scopeNewOrderForActor,
} from '@/lib/auth/orderAccess';
import {
  OrderService,
  CreateOrderSchema,
} from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';
import { UUIDSchema } from '@/lib/validation/common';
import { isValidStatusTransition, type OrderListParams, type OrderStatus } from '@/lib/types/order';
import { InvalidOrderStatusTransitionError, UnauthorizedError } from '@/server/services/errors';
import { z } from 'zod';

const orderService = new OrderService();
const auditService = new AuditService();

const OrderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

/**
 * H7 — pins list queries to the caller's own scope outside the admin flows.
 * A customer's customerId filter is forced to their own record (never another
 * customer's); a dealer's dealerId filter is forced to their own record. The
 * counterparty filter a non-admin may still supply only narrows the forced
 * scope, so it cannot widen access. Accounts without a profile are pinned to a
 * nil UUID, which matches no rows, instead of being left unfiltered.
 */
async function scopedListParamsForActor(
  auth: AuthContext,
  params: OrderListParams,
): Promise<OrderListParams> {
  if (hasMinRole(auth, 'admin')) {
    return params;
  }
  if (auth.role === 'customer') {
    const ownCustomerId = await resolveCustomerRecordId(auth.userId);
    return { ...params, customerId: ownCustomerId ?? NIL_UUID };
  }
  if (auth.role === 'dealer') {
    const ownDealerId = await resolveDealerRecordId(auth.userId);
    return { ...params, dealerId: ownDealerId ?? NIL_UUID };
  }
  throw new UnauthorizedError('Access denied: list orders');
}

// ──────────────────────────────────────────────────────────────
// Existing Actions
// ──────────────────────────────────────────────────────────────

export async function createOrder(
  data: z.infer<typeof CreateOrderSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.create');
    const validated = CreateOrderSchema.parse(data);
    // H7 — customers/dealers cannot forge ownership, initial status, or
    // vehicle-derived totals (see scopeNewOrderForActor); admin flows pass through.
    const scoped = await scopeNewOrderForActor(auth, validated);
    const order = await orderService.createOrder(scoped);

    await auditService.logAction({
      action: 'order.created',
      entityType: 'order',
      entityId: order.id as string,
      metadata: {
        orderNumber: scoped.orderNumber,
        customerId: scoped.customerId,
        vehicleId: scoped.vehicleId,
        totalAmount: scoped.totalAmount,
      },
    });

    return { success: true, data: order };
  } catch (error) {
    return handleError(error);
  }
}

export async function listOrdersForAdmin(
  params: OrderListParams,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.read');
    const scopedParams = await scopedListParamsForActor(auth, params);
    const result = await orderService.listOrders(scopedParams);
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function getOrderDetail(orderId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.read');
    UUIDSchema.parse(orderId);
    await assertOrderAccess(auth, orderId);
    const order = await orderService.getOrderDetail(orderId);
    return { success: true, data: order };
  } catch (error) {
    return handleError(error);
  }
}

export async function getOrderForEditAction(orderId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.read');
    UUIDSchema.parse(orderId);
    await assertOrderAccess(auth, orderId);
    const order = await orderService.getOrderForEdit(orderId);
    return { success: true, data: order };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateOrder(
  orderId: string,
  data: { orderNumber?: string; customerId?: string | null; dealerId?: string | null; vehicleId?: string | null; status?: string; totalAmount?: number },
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.update');
    UUIDSchema.parse(orderId);
    // H7 — load + authorize: customers own their orders, dealers their own,
    // admins unrestricted (404 unknown, 401 foreign).
    const existing = await assertOrderAccess(auth, orderId);

    // H7 — outside the admin staff flows, customer/dealer ownership of the
    // order can never be reassigned through this action.
    if (!hasMinRole(auth, 'admin')) {
      if (data.customerId !== undefined && data.customerId !== existing.customerId) {
        throw new UnauthorizedError('Access denied: reassign the customer of an order');
      }
      if (data.dealerId !== undefined && data.dealerId !== existing.dealerId) {
        throw new UnauthorizedError('Access denied: reassign the dealer of an order');
      }
    }

    // H7 — status changes must not bypass the transition validator
    // (unchanged values are a no-op, preserving the admin edit form).
    if (data.status !== undefined && data.status !== existing.status) {
      if (!isValidStatusTransition(existing.status as OrderStatus, data.status as OrderStatus)) {
        throw new InvalidOrderStatusTransitionError(existing.status, data.status);
      }
    }

    const updated = await orderService.updateOrder(orderId, data);

    await auditService.logAction({
      action: 'order.updated',
      entityType: 'order',
      entityId: orderId,
      metadata: { changes: data },
    });

    return { success: true, data: updated };
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
    await requirePermission(session, 'orders.update');
    UUIDSchema.parse(orderId);
    await assertOrderAccess(session, orderId);
    const validatedStatus = OrderStatusSchema.parse(status);
    const updated = await orderService.changeOrderStatus(
      orderId,
      validatedStatus,
      session.userId,
      note,
    );

    await auditService.logAction({
      action: 'order.status_changed',
      entityType: 'order',
      entityId: orderId,
      metadata: { status, note: note ?? null },
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
    await requirePermission(session, 'orders.update');
    UUIDSchema.parse(orderId);
    await assertOrderAccess(session, orderId);
    const createdNote = await orderService.addNote(orderId, note, session.userId);

    await auditService.logAction({
      action: 'order.note_added',
      entityType: 'order',
      entityId: orderId,
      metadata: { note },
    });

    return { success: true, data: createdNote };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteOrderNote(noteId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.update');
    UUIDSchema.parse(noteId);
    // H7 — authorize through the note's parent order.
    const parentOrderId = await loadOrderNoteOrderId(noteId);
    if (parentOrderId) {
      await assertOrderAccess(auth, parentOrderId);
    }
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
    await requirePermission(session, 'orders.update');
    UUIDSchema.parse(orderId);
    await assertOrderAccess(session, orderId);
    const createdDoc = await orderService.addDocument(
      orderId,
      documentUrl,
      session.userId,
    );

    await auditService.logAction({
      action: 'order.document_added',
      entityType: 'order',
      entityId: orderId,
      metadata: { documentUrl },
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
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.update');
    UUIDSchema.parse(documentId);
    // H7 — authorize through the document's parent order (unknown IDs fall
    // through to the service's DocumentNotFoundError, preserving 404s).
    const parentOrderId = await loadOrderDocumentOrderId(documentId);
    if (parentOrderId) {
      await assertOrderAccess(auth, parentOrderId);
    }
    const deleted = await orderService.deleteDocument(documentId);
    return { success: true, data: deleted };
  } catch (error) {
    return handleError(error);
  }
}

export async function softDeleteOrder(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'orders.delete');
    UUIDSchema.parse(orderId);
    await assertOrderAccess(session, orderId);
    const deleted = await orderService.softDeleteOrder(orderId, session.userId);

    await auditService.logAction({
      action: 'order.soft_deleted',
      entityType: 'order',
      entityId: orderId,
      metadata: { deleted: true },
    });

    return { success: true, data: deleted };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreOrder(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'orders.update');
    UUIDSchema.parse(orderId);
    await assertOrderAccess(session, orderId);
    const restored = await orderService.restoreOrder(orderId);

    await auditService.logAction({
      action: 'order.restored',
      entityType: 'order',
      entityId: orderId,
      metadata: { restored: true },
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
    await requirePermission(session, 'orders.update');
    ids.forEach((id) => UUIDSchema.parse(id));
    const validatedStatus = OrderStatusSchema.parse(status);
    // H7 — authorize every target first so a foreign ID cannot slip through
    // after part of the batch has already been mutated.
    for (const id of ids) {
      await assertOrderAccess(session, id);
    }
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
    await requirePermission(session, 'orders.delete');
    ids.forEach((id) => UUIDSchema.parse(id));
    // H7 — authorize every target before any mutation (no partial batches).
    for (const id of ids) {
      await assertOrderAccess(session, id);
    }
    const results = await orderService.bulkDelete(ids, session.userId);
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function getOrderStats(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.read');
    // H7 — global order statistics are staff-only aggregates.
    if (!hasMinRole(auth, 'admin')) {
      throw new UnauthorizedError('Access denied: view order statistics');
    }
    const stats = await orderService.getOrderStats();
    return { success: true, data: stats };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkRestoreOrders(ids: string[]): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await requirePermission(session, 'orders.update');
    ids.forEach((id) => UUIDSchema.parse(id));
    // H7 — authorize every target before any mutation.
    for (const id of ids) {
      await assertOrderAccess(session, id);
    }
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
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.read');
    // H7 — same scoping as listOrdersForAdmin.
    const scopedParams = await scopedListParamsForActor(auth, params);
    const result = await orderService.listOrders({ ...scopedParams, limit: 10000, page: 1 });
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
    await requirePermission(session, 'orders.update');
    UUIDSchema.parse(orderId);
    UUIDSchema.parse(dealerId);
    // H7 — load + authorize the order first (dealers can only reach their
    // own orders, customers theirs, admins any).
    const existing = await assertOrderAccess(session, orderId);
    // H7 — outside the admin staff flows the dealer assignment cannot change.
    if (!hasMinRole(session, 'admin') && dealerId !== existing.dealerId) {
      throw new UnauthorizedError('Access denied: reassign the dealer of an order');
    }
    const result = await orderService.assignDealer(
      orderId,
      dealerId,
      session.userId,
    );

    await auditService.logAction({
      action: 'order.dealer_assigned',
      entityType: 'order',
      entityId: orderId,
      metadata: { dealerId },
    });

    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}
