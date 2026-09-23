import { AnalyticsService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';
import { enforceRateLimit, getRateLimitIdentifier } from '@/lib/api/rateLimiter';

const analyticsService = new AnalyticsService();

export const POST = withErrorHandler(async (req: Request) => {
  await enforceRateLimit('analytics-views', getRateLimitIdentifier(req), 200, 60000);
  const body = await req.json();
  const view = await analyticsService.trackPageView(body);
  return apiSuccess(view, undefined, 'Page view tracked', 201);
});
