import { CustomerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const customerService = new CustomerService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const alert = await customerService.createAlert(body);
  return apiSuccess(alert, undefined, 'Alert created successfully', 201);
});
