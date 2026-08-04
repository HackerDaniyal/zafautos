import { createClient } from '@/lib/supabase/server';
import { AuthRepository } from '@/server/repositories';
import { UnauthorizedError } from '@/server/services/errors';
import type { AuthContext, UserRole } from './types';

const authRepo = new AuthRepository();

/**
 * Resolves the current Supabase session into an AuthContext.
 *
 * Uses `supabase.auth.getUser()` which validates the JWT server-side.
 * Role is resolved from the database `users.role` column (source of truth),
 * NOT from user_metadata. This ensures admin role changes take effect immediately.
 * Returns null for unauthenticated requests.
 */
export async function getSession(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return null;
  }

  // Resolve role from database (source of truth)
  const dbUser = await authRepo.findUserById(user.id);
  const role: UserRole = (dbUser?.role as string as UserRole) ?? 'customer';

  return {
    supabaseUser: user,
    userId: user.id,
    email: user.email,
    role,
  };
}

/**
 * Returns the AuthContext for authenticated requests.
 * Throws UnauthorizedError (401) if no valid session exists.
 *
 * Use this in route handlers that require authentication.
 */
export async function requireAuth(): Promise<AuthContext> {
  // TEMPORARY BYPASS — REMOVE BEFORE PRODUCTION
  if (process.env.AUTH_BYPASS === 'true') {
    return {
      supabaseUser: { id: 'temp-bypass', email: 'admin@zafautos.com' } as AuthContext['supabaseUser'],
      userId: 'temp-bypass',
      email: 'admin@zafautos.com',
      role: 'super_admin',
    };
  }

  const session = await getSession();

  if (!session) {
    throw new UnauthorizedError('No active session. Please sign in.');
  }

  return session;
}

/**
 * Returns the AuthContext or null for guest-tolerant routes.
 * Never throws. Use this when authentication is optional.
 */
export async function getCurrentUser(): Promise<AuthContext | null> {
  return getSession();
}
