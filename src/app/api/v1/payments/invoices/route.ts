import { PaymentService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const paymentService = new PaymentService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const invoice = await paymentService.createInvoice(body);
  return apiSuccess(invoice, undefined, 'Invoice created successfully', 201);
});
