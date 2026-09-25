import { PaymentService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { enforceRateLimit, getRateLimitIdentifierAuthenticated } from '@/lib/api/rateLimiter';
import { assertOrderRouteAccess } from '@/lib/auth/orderAccess';

const paymentService = new PaymentService();

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

export const POST = withAuth(async (req, auth, context) => {
  await enforceRateLimit('payments-create', getRateLimitIdentifierAuthenticated(auth.userId), RATE_LIMIT, RATE_WINDOW_MS);
  // H7 — the URL orderId is authoritative: it is validated (UUID) and
  // ownership-checked here, then forced onto the invoice below, so a
  // request-body orderId can never redirect the write to another order.
  const orderId = await assertOrderRouteAccess(auth, context.params, 'orderId');
  const body = await req.json();
  const invoice = await paymentService.createInvoice({ ...body, orderId });
  return apiSuccess(invoice, undefined, 'Invoice created successfully', 201);
}, { permission: 'payments.create' });
