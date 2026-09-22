import { MarketplaceService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError, UnauthorizedError } from '@/server/services/errors';

const marketplaceService = new MarketplaceService();

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  if (auth.userId !== userId) {
    throw new UnauthorizedError('Access denied: cannot view other users wishlist');
  }

  const wishlist = await marketplaceService.getWishlist(userId);
  return apiSuccess(wishlist);
});

export const POST = withAuth(async (req, auth) => {
  const body = await req.json();
  const { vehicleId } = body;

  await marketplaceService.addToWishlist(auth.userId, vehicleId);
  return apiSuccess(null, undefined, 'Added to wishlist', 201);
});

export const DELETE = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get('vehicleId');

  if (!vehicleId) {
    throw new ValidationError('Vehicle ID is required');
  }

  await marketplaceService.removeFromWishlist(auth.userId, vehicleId);
  return apiSuccess(null, undefined, 'Removed from wishlist', 200);
});
