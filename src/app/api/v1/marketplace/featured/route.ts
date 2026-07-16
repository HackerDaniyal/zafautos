import { MarketplaceService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const marketplaceService = new MarketplaceService();

export const GET = withErrorHandler(async () => {
  const featured = await marketplaceService.getFeaturedVehicles();
  return apiSuccess(featured);
});
