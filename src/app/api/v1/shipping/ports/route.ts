import { ShippingService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const shippingService = new ShippingService();

export const GET = withErrorHandler(async () => {
  const ports = await shippingService.listPorts();
  return apiSuccess(ports);
});
