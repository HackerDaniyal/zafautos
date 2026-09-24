import { CustomerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError, UnauthorizedError } from '@/server/services/errors';
import { hasMinRole } from '@/lib/auth/rbac';

const customerService = new CustomerService();

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  if (auth.userId !== userId && !hasMinRole(auth, 'admin')) {
    throw new UnauthorizedError('Access denied: cannot view other customers profile');
  }

  const profile = await customerService.getCustomerByUserId(userId);
  return apiSuccess(profile);
});
