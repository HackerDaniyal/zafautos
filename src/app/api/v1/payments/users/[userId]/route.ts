import { PaymentService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { enforceRateLimit, getRateLimitIdentifierAuthenticated } from '@/lib/api/rateLimiter';
import { assertOrderAccess } from '@/lib/auth/orderAccess';
import { hasMinRole } from '@/lib/auth/rbac';
import { UnauthorizedError } from '@/server/services/errors';
import { UUIDSchema } from '@/lib/validation/common';

const paymentService = new PaymentService();

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

export const POST = withAuth(async (req, auth, context) => {
  await enforceRateLimit('payments-create', getRateLimitIdentifierAuthenticated(auth.userId), RATE_LIMIT, RATE_WINDOW_MS);
  // H7 — the URL userId is authoritative: identity is taken from the URL and
  // enforced here, never from the request body. Non-admins may only act as
  // themselves; admins may act for any user.
  const { userId } = await context.params;
  UUIDSchema.parse(userId);
  if (!hasMinRole(auth, 'admin') && auth.userId !== userId) {
    throw new UnauthorizedError('create invoices for another user');
  }
  const body = await req.json();
  // Invoices carry no userId column (the URL user cannot be "stored" from the
  // body); the target order must exist and be owned by the acting caller for
  // non-admins, otherwise the write is refused.
  const { userId: _bodyUserId, orderId, ...rest } = (body ?? {}) as Record<string, unknown>;
  const parsedOrderId = UUIDSchema.parse(orderId);
  await assertOrderAccess(auth, parsedOrderId);
  const invoice = await paymentService.createInvoice({
    ...rest,
    orderId: parsedOrderId,
  } as unknown as Parameters<typeof paymentService.createInvoice>[0]);
  return apiSuccess(invoice, undefined, 'Invoice created successfully', 201);
}, { permission: 'payments.create' });
