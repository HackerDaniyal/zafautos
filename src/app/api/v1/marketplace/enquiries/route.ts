import { MarketplaceService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { enforceRateLimit, getRateLimitIdentifier, RateLimitExceededError } from '@/lib/api/rateLimiter';

const marketplaceService = new MarketplaceService();

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export const POST = withErrorHandler(async (req: Request) => {
  try {
    await enforceRateLimit('marketplace-enquiries', getRateLimitIdentifier(req), RATE_LIMIT, RATE_WINDOW_MS);
  } catch (error) {
    const headers = new Headers();
    if (error instanceof RateLimitExceededError && error.retryAfterSeconds) {
      headers.set('Retry-After', String(error.retryAfterSeconds));
    }
    return apiError('Too many requests. Please try again later.', 'RATE_LIMITED', 429, undefined, headers);
  }

  const body = await req.json();
  const enquiry = await marketplaceService.submitEnquiry(body);
  return apiSuccess(enquiry, undefined, 'Enquiry submitted successfully', 201);
});
