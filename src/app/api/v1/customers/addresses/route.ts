import { CustomerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError } from '@/server/services/errors';

const customerService = new CustomerService();

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');

  if (!customerId) {
    throw new ValidationError('Customer ID is required');
  }

  const addresses = await customerService.getAddresses(customerId);
  return apiSuccess(addresses);
});

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const address = await customerService.createAddress(body);
  return apiSuccess(address, undefined, 'Address created successfully', 201);
});
