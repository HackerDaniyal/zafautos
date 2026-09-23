import { PaymentService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { enforceRateLimit, getRateLimitIdentifierAuthenticated } from '@/lib/api/rateLimiter';

const paymentService = new PaymentService();

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

export const POST = withAuth(async (req, auth) => {
  await enforceRateLimit('payments-create', getRateLimitIdentifierAuthenticated(auth.userId), RATE_LIMIT, RATE_WINDOW_MS);
  const body = await req.json();
  const payment = await paymentService.createPayment(body);
  return apiSuccess(payment, undefined, 'Payment created successfully', 201);
}, { permission: 'payments.create' });
