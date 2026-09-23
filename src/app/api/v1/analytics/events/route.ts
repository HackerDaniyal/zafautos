import { AnalyticsService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';
import { enforceRateLimit, getRateLimitIdentifier } from '@/lib/api/rateLimiter';

const analyticsService = new AnalyticsService();

export const POST = withErrorHandler(async (req: Request) => {
  await enforceRateLimit('analytics-events', getRateLimitIdentifier(req), 100, 60000);
  const body = await req.json();
  const event = await analyticsService.trackEvent(body);
  return apiSuccess(event, undefined, 'Event tracked', 201);
});
