import { DealerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError } from '@/server/services/errors';

const dealerService = new DealerService();

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  const profile = await dealerService.getDealerByUserId(userId);
  return apiSuccess(profile);
});
