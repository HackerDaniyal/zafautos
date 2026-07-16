import { PaymentService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const paymentService = new PaymentService();

export const PATCH = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await req.json();
  const payment = await paymentService.updatePaymentStatus(id, body.status);
  return apiSuccess(payment, undefined, 'Payment status updated successfully');
});
