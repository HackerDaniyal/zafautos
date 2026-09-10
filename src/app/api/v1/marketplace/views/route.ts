import { MarketplaceService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const marketplaceService = new MarketplaceService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { vehicleId, userId } = body;
  
  await marketplaceService.recordVehicleView(vehicleId, userId);
  return apiSuccess(null, undefined, 'View recorded', 201);
});
