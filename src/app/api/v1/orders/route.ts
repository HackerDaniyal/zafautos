import { OrderService } from '@/server/services';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { UnauthorizedError } from '@/server/services/errors';
import { enforceRateLimit, getRateLimitIdentifierAuthenticated } from '@/lib/api/rateLimiter';
import { hasMinRole } from '@/lib/auth/rbac';
import {
  resolveCustomerRecordId,
  resolveDealerRecordId,
  scopeNewOrderForActor,
} from '@/lib/auth/orderAccess';

const orderService = new OrderService();

const CREATE_RATE_LIMIT = 10;
const CREATE_RATE_WINDOW_MS = 60 * 1000;

// H7 / Phase D3 — list scoping: customers are pinned to their own record,
// dealers to their own dealer record, admins keep filter access.
export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const dealerId = searchParams.get('dealerId');

  let orders: unknown[] = [];
  if (auth.role === 'customer') {
    const ownCustomerId = await resolveCustomerRecordId(auth.userId);
    if (dealerId) {
      throw new UnauthorizedError('Access denied: customers cannot view dealer orders');
    }
    if (customerId && customerId !== ownCustomerId) {
      throw new UnauthorizedError('Access denied: cannot view other customers orders');
    }
    if (ownCustomerId) {
      orders = await orderService.getOrdersByCustomer(customerId ?? ownCustomerId);
    }
  } else if (auth.role === 'dealer') {
    if (customerId) {
      throw new UnauthorizedError('Access denied: dealers cannot query by customerId');
    }
    if (dealerId) {
      const ownDealerId = await resolveDealerRecordId(auth.userId);
      if (!ownDealerId || dealerId !== ownDealerId) {
        throw new UnauthorizedError('Access denied: cannot view other dealers orders');
      }
      orders = await orderService.getOrdersByDealer(dealerId);
    }
    // No dealerId filter: preserve the existing empty result.
  } else if (hasMinRole(auth, 'admin')) {
    if (customerId) {
      orders = await orderService.getOrdersByCustomer(customerId);
    } else if (dealerId) {
      orders = await orderService.getOrdersByDealer(dealerId);
    }
    // No filters: preserve the existing empty result.
  } else {
    throw new UnauthorizedError('Access denied: view orders');
  }

  return apiSuccess(orders);
}, { permission: 'orders.read' });

export const POST = withAuth(async (req, auth) => {
  await enforceRateLimit('orders-create', getRateLimitIdentifierAuthenticated(auth.userId), CREATE_RATE_LIMIT, CREATE_RATE_WINDOW_MS);
  const body = await req.json();
  // H7 / Phase D3 — never trust caller-supplied ownership/status/totals
  // outside the admin staff flows (see scopeNewOrderForActor).
  const scopedBody = await scopeNewOrderForActor(auth, body);
  const order = await orderService.createOrder(scopedBody);
  return apiSuccess(order, undefined, 'Order created successfully', 201);
}, { permission: 'orders.create' });
