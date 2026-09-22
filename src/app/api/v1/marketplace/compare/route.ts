import { MarketplaceService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';

const marketplaceService = new MarketplaceService();

export const POST = withAuth(async (req, auth) => {
  const body = await req.json();
  const { vehicleId } = body;

  await marketplaceService.addToComparison(auth.userId, vehicleId);
  return apiSuccess(null, undefined, 'Added to comparison', 201);
});
