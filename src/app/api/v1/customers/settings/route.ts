import { CustomerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError, UnauthorizedError } from '@/server/services/errors';

const customerService = new CustomerService();

export const PATCH = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const body = await req.json();

  if (!customerId) {
    throw new ValidationError('Customer ID is required');
  }

  if (auth.role === 'customer') {
    const customer = await customerService.getCustomerByUserId(auth.userId);
    if (!customer || (customer as { id: string }).id !== customerId) {
      throw new UnauthorizedError('Access denied: cannot modify other customers settings');
    }
  }

  const settings = await customerService.updateSettings(customerId, body);
  return apiSuccess(settings, undefined, 'Settings updated successfully');
});
