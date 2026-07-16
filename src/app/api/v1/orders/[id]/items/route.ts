import { OrderService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const orderService = new OrderService();

export const POST = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await req.json();
  const item = await orderService.addOrderItem({ ...body, orderId: id });
  return apiSuccess(item, undefined, 'Item added to order', 201);
});
