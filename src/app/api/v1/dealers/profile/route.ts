import { DealerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError, UnauthorizedError } from '@/server/services/errors';

const dealerService = new DealerService();

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  if (auth.role === 'dealer' && auth.userId !== userId) {
    throw new UnauthorizedError('Access denied: cannot view other dealers profile');
  }

  const profile = await dealerService.getDealerByUserId(userId);
  return apiSuccess(profile);
});
