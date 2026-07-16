import { ShippingService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const shippingService = new ShippingService();

export const GET = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { orderId } = await (context as { params: Promise<{ orderId: string }> }).params;
  const shipments = await shippingService.getShipmentsByOrderId(orderId);
  return apiSuccess(shipments);
});
