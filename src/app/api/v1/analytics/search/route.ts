import { AnalyticsService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';
import { enforceRateLimit, getRateLimitIdentifier } from '@/lib/api/rateLimiter';

const analyticsService = new AnalyticsService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  await enforceRateLimit('analytics-search', getRateLimitIdentifier(req), 60, 60000);
  const record = await analyticsService.recordSearch(body);
  return apiSuccess(record, undefined, 'Search recorded', 201);
});
