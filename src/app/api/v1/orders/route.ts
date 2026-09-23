import { OrderService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { UnauthorizedError } from '@/server/services/errors';
import { enforceRateLimit, getRateLimitIdentifierAuthenticated } from '@/lib/api/rateLimiter';

const orderService = new OrderService();

const CREATE_RATE_LIMIT = 10;
const CREATE_RATE_WINDOW_MS = 60 * 1000;

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const dealerId = searchParams.get('dealerId');

  let orders: unknown[] = [];
  if (customerId) {
    if (auth.role === 'customer') {
      const customer = await new (await import('@/server/services')).CustomerService().getCustomerByUserId(auth.userId);
      if (!customer || (customer as { id: string }).id !== customerId) {
        throw new UnauthorizedError('Access denied: cannot view other customers orders');
      }
    }
    orders = await orderService.getOrdersByCustomer(customerId);
  } else if (dealerId) {
    if (auth.role === 'customer') {
      throw new UnauthorizedError('Access denied: customers cannot view dealer orders');
    }
    orders = await orderService.getOrdersByDealer(dealerId);
  } else {
    if (auth.role === 'customer') {
      const customer = await new (await import('@/server/services')).CustomerService().getCustomerByUserId(auth.userId);
      if (customer) {
        orders = await orderService.getOrdersByCustomer((customer as { id: string }).id);
      }
    } else {
      orders = [];
    }
  }

  return apiSuccess(orders);
}, { permission: 'orders.read' });

export const POST = withAuth(async (req, auth) => {
  await enforceRateLimit('orders-create', getRateLimitIdentifierAuthenticated(auth.userId), CREATE_RATE_LIMIT, CREATE_RATE_WINDOW_MS);
  const body = await req.json();
  const order = await orderService.createOrder(body);
  return apiSuccess(order, undefined, 'Order created successfully', 201);
}, { permission: 'orders.create' });
