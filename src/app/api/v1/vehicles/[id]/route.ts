import { ShippingService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const shippingService = new ShippingService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const shipment = await shippingService.createShipment(body);
  return apiSuccess(shipment, undefined, 'Shipment created successfully', 201);
});
