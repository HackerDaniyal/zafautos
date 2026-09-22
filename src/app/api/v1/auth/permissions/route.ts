import { AuthService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';

const authService = new AuthService();

export const GET = withAuth(async () => {
  const permissions = await authService.getPermissions();
  return apiSuccess(permissions);
}, { roles: ['admin', 'super_admin'] });
