import { PaymentService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const paymentService = new PaymentService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const payment = await paymentService.createPayment(body);
  return apiSuccess(payment, undefined, 'Payment created successfully', 201);
});
