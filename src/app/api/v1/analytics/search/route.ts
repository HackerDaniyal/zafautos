import { AnalyticsService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';
import { enforceRateLimit } from '@/lib/api/rateLimiter';

const analyticsService = new AnalyticsService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  // TODO Phase 5: enforce rate limit with real identifier (e.g. IP or userId)
  await enforceRateLimit('analytics-search', 60, 60000);
  const record = await analyticsService.recordSearch(body);
  return apiSuccess(record, undefined, 'Search recorded', 201);
});
