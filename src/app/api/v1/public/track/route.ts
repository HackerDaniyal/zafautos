import { db } from '@/server/db/client';
import { orders } from '@/server/db/schema/orders';
import { payments } from '@/server/db/schema/payments';
import { shipments, shipmentTracking } from '@/server/db/schema/shipping';
import { vehicles } from '@/server/db/schema/vehicles';
import { customers } from '@/server/db/schema/customers';
import { users } from '@/server/db/schema/auth';
import { eq, and, desc } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { enforceRateLimit, getRateLimitIdentifier } from '@/lib/api/rateLimiter';

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 5 * 60 * 1000;

export const POST = withErrorHandler(async (req: Request) => {
  const identifier = getRateLimitIdentifier(req);
  try {
    await enforceRateLimit('public-track', identifier, RATE_LIMIT, RATE_WINDOW_MS);
  } catch {
    return apiError('Too many requests. Please try again later.', 'RATE_LIMITED', 429);
  }

  const body = await req.json();
  const { orderNumber, email } = body as { orderNumber?: string; email?: string };

  if (!orderNumber || !email) {
    return apiError('Order number and email are required', 'BAD_REQUEST', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedOrderNumber = orderNumber.trim();

  // Find order
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      vehicleId: orders.vehicleId,
      customerId: orders.customerId,
    })
    .from(orders)
    .where(eq(orders.orderNumber, normalizedOrderNumber))
    .limit(1);

  if (!order) {
    return apiError('Order not found', 'NOT_FOUND', 404);
  }

  // Verify email matches the order's customer
  // Check: order has a customer → verify email matches their user account
  // Check: order has no customer (from lead conversion) → check if email exists in users table
  let emailVerified = false;

  if (order.customerId) {
    // Get customer → user → email
    const [customer] = await db
      .select({ userId: customers.userId })
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1);

    if (customer?.userId) {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, customer.userId))
        .limit(1);
      if (user?.email?.toLowerCase() === normalizedEmail) {
        emailVerified = true;
      }
    }
  }

  // If no customer on order, check if email exists in users table
  if (!emailVerified) {
    const [userMatch] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (userMatch) {
      emailVerified = true;
    }
  }

  if (!emailVerified) {
    return apiError('Order not found', 'NOT_FOUND', 404);
  }

  // Get vehicle info (only safe fields)
  let vehicle: { year: number | null; stockNumber: string | null } | null = null;
  if (order.vehicleId) {
    const [v] = await db
      .select({ year: vehicles.year, stockNumber: vehicles.stockNumber })
      .from(vehicles)
      .where(eq(vehicles.id, order.vehicleId))
      .limit(1);
    vehicle = v ?? null;
  }

  // Get payments (sanitized — no internal IDs, no method details beyond status)
  const orderPayments = await db
    .select({
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(and(eq(payments.orderId, order.id), eq(payments.deletedAt, null as unknown as Date)))
    .orderBy(desc(payments.createdAt));

  const totalPaid = orderPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Get shipments (sanitized — no internal IDs)
  const orderShipments = await db
    .select({
      status: shipments.status,
      carrier: shipments.carrier,
      trackingNumber: shipments.trackingNumber,
      estimatedDeparture: shipments.estimatedDeparture,
      estimatedArrival: shipments.estimatedArrival,
      actualDeparture: shipments.actualDeparture,
      actualArrival: shipments.actualArrival,
    })
    .from(shipments)
    .where(and(eq(shipments.orderId, order.id), eq(shipments.deletedAt, null as unknown as Date)))
    .orderBy(desc(shipments.createdAt));

  // Get tracking events (sanitized — location + note only, no user IDs)
  const shipmentIds = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(and(eq(shipments.orderId, order.id), eq(shipments.deletedAt, null as unknown as Date)));

  let trackingEvents: Array<{ location: string | null; note: string | null; createdAt: Date }> = [];
  if (shipmentIds.length > 0) {
    const ids = shipmentIds.map((s) => s.id);
    trackingEvents = await db
      .select({
        location: shipmentTracking.location,
        note: shipmentTracking.note,
        createdAt: shipmentTracking.createdAt,
      })
      .from(shipmentTracking)
      .where(and(
        eq(shipmentTracking.deletedAt, null as unknown as Date),
      ))
      .orderBy(desc(shipmentTracking.createdAt));
  }

  return apiSuccess({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    },
    vehicle,
    payments: orderPayments.map((p) => ({
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
    })),
    paymentSummary: {
      totalAmount: order.totalAmount,
      totalPaid,
      balance: order.totalAmount - totalPaid,
    },
    shipments: orderShipments.map((s) => ({
      status: s.status,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      estimatedDeparture: s.estimatedDeparture,
      estimatedArrival: s.estimatedArrival,
      actualDeparture: s.actualDeparture,
      actualArrival: s.actualArrival,
    })),
    trackingEvents: trackingEvents.map((t) => ({
      location: t.location,
      note: t.note,
      createdAt: t.createdAt,
    })),
  });
});
