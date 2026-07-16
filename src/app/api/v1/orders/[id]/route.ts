import { OrderService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const orderService = new OrderService();

export const GET = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const order = await orderService.getOrderByNumber(id);
  return apiSuccess(order);
});
