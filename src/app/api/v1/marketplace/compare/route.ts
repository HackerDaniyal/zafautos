import { MarketplaceService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const marketplaceService = new MarketplaceService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { userId, vehicleId } = body;
  
  await marketplaceService.addToComparison(userId, vehicleId);
  return apiSuccess(null, undefined, 'Added to comparison', 201);
});
