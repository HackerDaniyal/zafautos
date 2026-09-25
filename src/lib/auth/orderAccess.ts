import { db } from '@/server/db/client';
import { customers, dealers, orderDocuments, orderNotes, orders, vehicles } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { hasMinRole } from './rbac';
import type { AuthContext } from './types';
import { OrderNotFoundError, UnauthorizedError } from '@/server/services/errors';
import { UUIDSchema } from '@/lib/validation/common';

export interface OrderOwnership {
  id: string;
  customerId: string | null;
  dealerId: string | null;
  status: string;
}

export async function resolveCustomerRecordId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

export async function resolveDealerRecordId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: dealers.id })
    .from(dealers)
    .where(eq(dealers.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

export async function loadOrderOwnership(orderId: string): Promise<OrderOwnership | null> {
  const [row] = await db
    .select({
      id: orders.id,
      customerId: orders.customerId,
      dealerId: orders.dealerId,
      status: orders.status,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return row ?? null;
}

/**
 * Resource authorization for a single order (H7 / Phase D3).
 *
 * Mirrors the accountActions.ts customer pattern and the
 * dealers/assignments route dealer pattern:
 *   - admin / super_admin → unrestricted (legitimate staff access)
 *   - customer            → own orders only (orders.customerId → customers.userId)
 *   - dealer              → own-dealer orders only (orders.dealerId → dealers.userId)
 *
 * Throws instead of returning a boolean so callers cannot forget the negative
 * branch: OrderNotFoundError (404) for unknown IDs, UnauthorizedError (401)
 * for orders the caller does not own.
 */
export async function assertOrderAccess(
  auth: AuthContext,
  orderId: string,
): Promise<OrderOwnership> {
  const order = await loadOrderOwnership(orderId);
  if (!order) {
    throw new OrderNotFoundError(orderId);
  }
  if (hasMinRole(auth, 'admin')) {
    return order;
  }
  if (auth.role === 'customer') {
    const ownCustomerId = await resolveCustomerRecordId(auth.userId);
    if (!ownCustomerId || order.customerId !== ownCustomerId) {
      throw new UnauthorizedError('access an order that belongs to another customer');
    }
    return order;
  }
  if (auth.role === 'dealer') {
    const ownDealerId = await resolveDealerRecordId(auth.userId);
    if (!ownDealerId || order.dealerId !== ownDealerId) {
      throw new UnauthorizedError('access an order that belongs to another dealer');
    }
    return order;
  }
  throw new UnauthorizedError('access this order');
}

/**
 * Scaffold for dynamic order routes: parses the URL parameter, validates it is
 * a UUID, then runs the full ownership check. 501 stub handlers call this
 * before returning "Not implemented" so that implementing business logic later
 * cannot accidentally ship an IDOR endpoint (H7).
 *
 * Returns the validated order ID for reuse by the eventual implementation.
 */
export async function assertOrderRouteAccess(
  auth: AuthContext,
  params: Promise<Record<string, string | string[]>>,
  paramName = 'id',
): Promise<string> {
  const bag = await params;
  const raw = bag[paramName];
  const orderId = UUIDSchema.parse(String(Array.isArray(raw) ? raw[0] : raw));
  await assertOrderAccess(auth, orderId);
  return orderId;
}

/** New-order input shape shared by the orders API route and createOrder action. */
export interface NewOrderInput {
  customerId?: string | null;
  dealerId?: string | null;
  vehicleId?: string | null;
  status?: string;
  totalAmount?: number;
  [key: string]: unknown;
}

async function deriveTotalFromVehicle(
  vehicleId: string | null | undefined,
  clientTotal?: number,
): Promise<number> {
  if (!vehicleId) {
    // Nothing to derive server-side — keep the caller-supplied amount.
    return clientTotal ?? 0;
  }
  const [vehicle] = await db
    .select({ price: vehicles.price })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  // Server-derived price: any client-supplied totalAmount is ignored (H7).
  return vehicle?.price ?? 0;
}

/**
 * Creation scoping for POST /orders and the createOrder action (H7).
 *
 * Never trusts caller-supplied ownership or status outside the admin staff
 * flows:
 *   - admin / super_admin → input unchanged (admin UI legitimately creates
 *     orders for any customer/dealer with explicit status and totals)
 *   - customer            → customerId forced to the caller's own record,
 *     status forced to 'pending', totalAmount derived from the vehicle price
 *     when a vehicle is present
 *   - dealer              → dealerId forced to the caller's own record
 *     (same pattern as dealers/assignments POST), status 'pending', totals
 *     derived as above
 *
 * customerId supplied by a dealer (they sell TO customers) and dealerId
 * supplied by a customer (they choose who to buy FROM) stay intact; both are
 * foreign-key constrained by the database.
 */
export async function scopeNewOrderForActor<T extends NewOrderInput>(
  auth: AuthContext,
  input: T,
): Promise<T> {
  if (hasMinRole(auth, 'admin')) {
    return input;
  }

  const scoped: T = { ...input };
  if (auth.role === 'customer') {
    const ownCustomerId = await resolveCustomerRecordId(auth.userId);
    if (!ownCustomerId) {
      throw new UnauthorizedError('create orders without a customer profile');
    }
    scoped.customerId = ownCustomerId;
    scoped.status = 'pending';
    scoped.totalAmount = await deriveTotalFromVehicle(input.vehicleId, input.totalAmount);
    return scoped;
  }
  if (auth.role === 'dealer') {
    const ownDealerId = await resolveDealerRecordId(auth.userId);
    if (!ownDealerId) {
      throw new UnauthorizedError('create orders without a dealer profile');
    }
    scoped.dealerId = ownDealerId;
    scoped.status = 'pending';
    scoped.totalAmount = await deriveTotalFromVehicle(input.vehicleId, input.totalAmount);
    return scoped;
  }
  throw new UnauthorizedError('create orders');
}

export async function loadOrderNoteOrderId(noteId: string): Promise<string | null> {
  const [row] = await db
    .select({ orderId: orderNotes.orderId })
    .from(orderNotes)
    .where(eq(orderNotes.id, noteId))
    .limit(1);
  return row?.orderId ?? null;
}

export async function loadOrderDocumentOrderId(documentId: string): Promise<string | null> {
  const [row] = await db
    .select({ orderId: orderDocuments.orderId })
    .from(orderDocuments)
    .where(eq(orderDocuments.id, documentId))
    .limit(1);
  return row?.orderId ?? null;
}
