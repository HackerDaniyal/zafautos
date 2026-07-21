import { MarketplaceService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError } from '@/server/services/errors';

const marketplaceService = new MarketplaceService();

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  const wishlist = await marketplaceService.getWishlist(userId);
  return apiSuccess(wishlist);
});

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { userId, vehicleId } = body;
  
  await marketplaceService.addToWishlist(userId, vehicleId);
  return apiSuccess(null, undefined, 'Added to wishlist', 201);
});

export const DELETE = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const vehicleId = searchParams.get('vehicleId');

  if (!userId || !vehicleId) {
    throw new ValidationError('User ID and Vehicle ID are required');
  }

  await marketplaceService.removeFromWishlist(userId, vehicleId);
  return apiSuccess(null, undefined, 'Removed from wishlist', 200);
});
