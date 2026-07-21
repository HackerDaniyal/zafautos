import { CustomerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError } from '@/server/services/errors';

const customerService = new CustomerService();

export const PATCH = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const body = await req.json();

  if (!customerId) {
    throw new ValidationError('Customer ID is required');
  }

  const settings = await customerService.updateSettings(customerId, body);
  return apiSuccess(settings, undefined, 'Settings updated successfully');
});
