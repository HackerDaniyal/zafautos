import { OrderService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const orderService = new OrderService();

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const dealerId = searchParams.get('dealerId');

  let orders: unknown[] = [];
  if (customerId) {
    orders = await orderService.getOrdersByCustomer(customerId);
  } else if (dealerId) {
    orders = await orderService.getOrdersByDealer(dealerId);
  } else {
    // If no filter, this might require a different service method or return empty
    // For now, return empty or we could add getAllOrders to service
    orders = [];
  }

  return apiSuccess(orders);
});

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const order = await orderService.createOrder(body);
  return apiSuccess(order, undefined, 'Order created successfully', 201);
});
