import { AuthService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const authService = new AuthService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const user = await authService.createUser(body);
  return apiSuccess(user, undefined, 'User registered successfully', 201);
});
