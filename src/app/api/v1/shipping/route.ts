import { ShippingService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';

const shippingService = new ShippingService();

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const shipment = await shippingService.createShipment(body);
  return apiSuccess(shipment, undefined, 'Shipment created successfully', 201);
}, { permission: 'shipping.create' });
