import { CustomerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { UnauthorizedError } from '@/server/services/errors';
import { hasMinRole } from '@/lib/auth/rbac';

const customerService = new CustomerService();

export const POST = withAuth(async (req, auth) => {
  const body = await req.json();

  if (auth.role === 'customer') {
    const customer = await customerService.getCustomerByUserId(auth.userId);
    if (!customer) {
      throw new UnauthorizedError('Customer profile not found');
    }
    body.customerId = (customer as { id: string }).id;
  } else if (!hasMinRole(auth, 'admin')) {
    throw new UnauthorizedError('Access denied: cannot create customer alerts');
  }

  const alert = await customerService.createAlert(body);
  return apiSuccess(alert, undefined, 'Alert created successfully', 201);
});
