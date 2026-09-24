import { DealerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError, UnauthorizedError } from '@/server/services/errors';
import { hasMinRole } from '@/lib/auth/rbac';

const dealerService = new DealerService();

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const dealerId = searchParams.get('dealerId');

  if (!dealerId) {
    throw new ValidationError('Dealer ID is required');
  }

  if (auth.role === 'dealer') {
    const dealer = await dealerService.getDealerByUserId(auth.userId);
    if (!dealer || (dealer as { id: string }).id !== dealerId) {
      throw new UnauthorizedError('Access denied: cannot view other dealers assignments');
    }
  } else if (!hasMinRole(auth, 'admin')) {
    throw new UnauthorizedError('Access denied: cannot view dealer assignments');
  }

  const assignments = await dealerService.getAssignments(dealerId);
  return apiSuccess(assignments);
});

export const POST = withAuth(async (req, auth) => {
  const body = await req.json();

  if (auth.role === 'dealer') {
    const dealer = await dealerService.getDealerByUserId(auth.userId);
    if (dealer) {
      body.dealerId = (dealer as { id: string }).id;
    }
  }

  const assignment = await dealerService.assignOrder(body);
  return apiSuccess(assignment, undefined, 'Order assigned successfully', 201);
}, { permission: 'orders.update' });
