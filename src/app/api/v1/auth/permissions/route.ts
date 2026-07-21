import { AuthService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const authService = new AuthService();

export const GET = withErrorHandler(async () => {
  const permissions = await authService.getPermissions();
  return apiSuccess(permissions);
});
