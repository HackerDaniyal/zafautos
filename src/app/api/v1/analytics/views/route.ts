import { AnalyticsService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const analyticsService = new AnalyticsService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const view = await analyticsService.trackPageView(body);
  return apiSuccess(view, undefined, 'Page view tracked', 201);
});
