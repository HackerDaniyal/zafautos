import { OrderService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const orderService = new OrderService();

export const PATCH = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await req.json();
  const order = await orderService.updateOrderStatus(id, body.status);
  return apiSuccess(order, undefined, 'Order status updated successfully');
});
