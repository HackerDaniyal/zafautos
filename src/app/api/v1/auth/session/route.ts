import { AuthService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';
import { ValidationError } from '@/server/services/errors';

const authService = new AuthService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const session = await authService.createSession(body);
  return apiSuccess(session, undefined, 'Session created successfully', 201);
});

export const DELETE = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    throw new ValidationError('Session ID is required in search params');
  }

  await authService.deleteSession(sessionId);
  return apiSuccess(null, undefined, 'Session deleted successfully', 200);
});
