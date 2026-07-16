import { ShippingService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const shippingService = new ShippingService();

export const POST = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await req.json();
  const event = await shippingService.addTrackingEvent({ ...body, shipmentId: id });
  return apiSuccess(event, undefined, 'Tracking event added successfully', 201);
});
