import { CustomerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError, UnauthorizedError } from '@/server/services/errors';

const customerService = new CustomerService();

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');

  if (!customerId) {
    throw new ValidationError('Customer ID is required');
  }

  if (auth.role === 'customer') {
    const customer = await customerService.getCustomerByUserId(auth.userId);
    if (!customer || (customer as { id: string }).id !== customerId) {
      throw new UnauthorizedError('Access denied: cannot view other customers addresses');
    }
  }

  const addresses = await customerService.getAddresses(customerId);
  return apiSuccess(addresses);
});

export const POST = withAuth(async (req, auth) => {
  const body = await req.json();

  if (auth.role === 'customer') {
    const customer = await customerService.getCustomerByUserId(auth.userId);
    if (!customer) {
      throw new UnauthorizedError('Customer profile not found');
    }
    body.customerId = (customer as { id: string }).id;
  }

  const address = await customerService.createAddress(body);
  return apiSuccess(address, undefined, 'Address created successfully', 201);
});
