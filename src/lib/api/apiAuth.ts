import { NextResponse } from 'next/server';
import { requireAuth, getSession } from '@/lib/auth/session';
import { requireRole, requirePermission } from '@/lib/auth/rbac';
import { apiError } from '@/lib/api/response';
import { RateLimitExceededError } from '@/lib/api/rateLimiter';
import { DomainError } from '@/server/services/errors';
import { ZodError } from 'zod';
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

/** Generic 429 — no routeKey/count/limit (calibration info); Retry-After when known. */
function rateLimitErrorResponse(error: DomainError): NextResponse {
  const headers = new Headers();
  if (error instanceof RateLimitExceededError && error.retryAfterSeconds) {
    headers.set('Retry-After', String(error.retryAfterSeconds));
  }
  return apiError(
    'Too many requests. Please try again later.',
    'RATE_LIMIT_EXCEEDED',
    429,
    undefined,
    headers,
  );
}

function authErrorResponse(error: unknown): NextResponse {
  // Auth-layer failures only — never echo raw messages for unexpected errors.
  if (error instanceof ZodError) {
    return apiError('Validation failed', 'VALIDATION_ERROR', 422, error.errors);
  }
  if (error instanceof DomainError) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      return rateLimitErrorResponse(error);
    }
    if (error.code === 'UNAUTHORIZED' || error.code === 'SESSION_EXPIRED') {
      return apiError(error.message, error.code, 401);
    }
    if (error.code === 'INVALID_CREDENTIALS') {
      return apiError(error.message, error.code, 401);
    }
    return apiError(error.message, error.code, 403);
  }
  console.error('[withAuth] unexpected error:', error);
  return apiError('Internal Server Error', 'INTERNAL_ERROR', 500);
}

function handlerErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return apiError('Validation failed', 'VALIDATION_ERROR', 422, error.errors);
  }
  if (error instanceof DomainError) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      return rateLimitErrorResponse(error);
    }
    if (
      error.code === 'UNAUTHORIZED' ||
      error.code === 'SESSION_EXPIRED' ||
      error.code === 'INVALID_CREDENTIALS'
    ) {
      return apiError(error.message, error.code, 401);
    }
    if (
      error.code === 'VALIDATION_ERROR' ||
      error.code === 'CONFLICT' ||
      error.code.endsWith('_NOT_FOUND')
    ) {
      const status = error.code === 'CONFLICT' ? 409 : error.code === 'VALIDATION_ERROR' ? 422 : 404;
      return apiError(error.message, error.code, status);
    }
    // Remaining DomainErrors are intentional domain messages (safe to surface).
    return apiError(error.message, error.code, 400);
  }
  // Non-domain handler failures must not leak internals.
  console.error('[withAuth handler] unexpected error:', error);
  return apiError('Internal Server Error', 'INTERNAL_ERROR', 500);
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
    let auth: AuthContext;
    try {
      auth = await requireAuth();

      if (options?.roles) {
        requireRole(auth, ...options.roles);
      }

      if (options?.permission) {
        await requirePermission(auth, options.permission);
      }
    } catch (error) {
      return authErrorResponse(error);
    }

    try {
      return await handler(req, auth, context);
    } catch (error) {
      return handlerErrorResponse(error);
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
