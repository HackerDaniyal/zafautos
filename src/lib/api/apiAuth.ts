import { NextResponse } from 'next/server';
import { requireAuth, getSession } from '@/lib/auth/session';
import { requireRole, requirePermission } from '@/lib/auth/rbac';
import { apiError } from '@/lib/api/response';
import type { AuthContext, UserRole } from '@/lib/auth/types';

type RouteContext = { params: Promise<Record<string, string | string[]>> };

type AuthenticatedHandler = (
  req: Request,
  auth: AuthContext,
  context: RouteContext,
) => Promise<NextResponse>;

type AuthOptions = {
  roles?: UserRole[];
  permission?: string;
};

function authErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Unauthorized';
  const code =
    error instanceof Error && 'code' in error
      ? (error as { code: string }).code
      : 'UNAUTHORIZED';
  if (code === 'RATE_LIMIT_EXCEEDED') {
    return apiError('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429);
  }
  const status = code === 'UNAUTHORIZED' || code === 'SESSION_EXPIRED' ? 401 : 403;
  return apiError(message, code, status);
}

/**
 * Wraps an API route handler with authentication.
 *
 * Usage:
 *   export const GET = withAuth(async (req, auth, context) => { ... });
 *
 * With role check:
 *   export const POST = withAuth(async (req, auth, context) => { ... }, { roles: ['admin'] });
 *
 * With permission check:
 *   export const DELETE = withAuth(async (req, auth, context) => { ... }, { permission: 'orders.delete' });
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options?: AuthOptions,
): (req: Request, context: RouteContext) => Promise<NextResponse> {
  return async (req: Request, context: RouteContext) => {
    try {
      const auth = await requireAuth();

      if (options?.roles) {
        requireRole(auth, ...options.roles);
      }

      if (options?.permission) {
        await requirePermission(auth, options.permission);
      }

      return await handler(req, auth, context);
    } catch (error) {
      return authErrorResponse(error);
    }
  };
}

/**
 * Returns the current session or null (does not throw).
 * Use for optional-auth endpoints.
 */
export async function getOptionalAuth(): Promise<AuthContext | null> {
  return getSession();
}
