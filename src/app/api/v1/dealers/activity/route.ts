import { DealerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const dealerService = new DealerService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const activity = await dealerService.logActivity(body);
  return apiSuccess(activity, undefined, 'Activity logged successfully', 201);
});
