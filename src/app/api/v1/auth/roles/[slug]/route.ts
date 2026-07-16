import { AuthService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const authService = new AuthService();

export const GET = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { slug } = await (context as { params: Promise<{ slug: string }> }).params;
  const role = await authService.getRoleBySlug(slug);
  return apiSuccess(role);
});
