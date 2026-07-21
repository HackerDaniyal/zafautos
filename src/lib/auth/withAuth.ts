import { NextResponse } from 'next/server';
import { requireAuth, getCurrentUser } from './session';
import type { AuthContext } from './types';
import { type RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiError } from '@/lib/api/response';
import { DomainError } from '@/server/services/errors';
import { ZodError } from 'zod';

// Handler types that receive an AuthContext
export type AuthedRequestHandler = (
  req: Request,
  context: RequestContext | undefined,
  auth: AuthContext
) => Promise<NextResponse>;

export type OptionalAuthRequestHandler = (
  req: Request,
  context: RequestContext | undefined,
  auth: AuthContext | null
) => Promise<NextResponse>;

/**
 * Wraps a route handler with session resolution and error handling.
 * Requires a valid Supabase session â€” throws UnauthorizedError (401) if absent.
 *
 * Usage:
 * ```ts
 * export const GET = withAuth(async (req, context, auth) => {
 *   // auth.userId, auth.role are guaranteed here
 * });
 * ```
 */
export function withAuth(handler: AuthedRequestHandler) {
  return async (req: Request, context?: RequestContext): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const headers = new Headers();
    headers.set('x-request-id', requestId);

    try {
      const auth = await requireAuth();
      const response = await handler(req, context, auth);
      response.headers.set('x-request-id', requestId);
      return response;
    } catch (error) {
      console.error(`[withAuth | Request ID: ${requestId}]`, error);

      if (error instanceof ZodError) {
        return apiError('Validation failed', 'VALIDATION_ERROR', 422, error.errors, headers);
      }

      if (error instanceof DomainError) {
        let status = 400;
        if (error.code === 'UNAUTHORIZED' || error.code === 'SESSION_EXPIRED' || error.code === 'INVALID_CREDENTIALS') {
          status = 401;
        } else if (error.code.endsWith('_NOT_FOUND')) {
          status = 404;
        } else if (['USER_ALREADY_EXISTS', 'VEHICLE_ALREADY_EXISTS', 'DUPLICATE_PAYMENT', 'CONFLICT'].includes(error.code)) {
          status = 409;
        } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
          status = 429;
        }
        return apiError(error.message, error.code, status, undefined, headers);
      }

      return apiError(
        'Internal Server Error',
        'INTERNAL_ERROR',
        500,
        process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        headers
      );
    }
  };
}

/**
 * Same as `withAuth` but does NOT require a session.
 * Injects `AuthContext | null` â€” null for unauthenticated/guest users.
 *
 * Usage:
 * ```ts
 * export const GET = withOptionalAuth(async (req, context, auth) => {
 *   if (auth) { /* authenticated * / } else { /* guest * / }
 * });
 * ```
 */
export function withOptionalAuth(handler: OptionalAuthRequestHandler) {
  return withErrorHandler(async (req: Request, context?: RequestContext) => {
    const auth = await getCurrentUser();
    return handler(req, context, auth);
  });
}
