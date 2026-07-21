import { DealerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError } from '@/server/services/errors';

const dealerService = new DealerService();

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const dealerId = searchParams.get('dealerId');

  if (!dealerId) {
    throw new ValidationError('Dealer ID is required');
  }

  const assignments = await dealerService.getAssignments(dealerId);
  return apiSuccess(assignments);
});

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const assignment = await dealerService.assignOrder(body);
  return apiSuccess(assignment, undefined, 'Order assigned successfully', 201);
});
