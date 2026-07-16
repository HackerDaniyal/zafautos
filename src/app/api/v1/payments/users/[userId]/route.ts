import { PaymentService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const paymentService = new PaymentService();

export const GET = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { userId } = await (context as { params: Promise<{ userId: string }> }).params;
  const payments = await paymentService.getPaymentsByUserId(userId);
  return apiSuccess(payments);
});
