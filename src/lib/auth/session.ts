import { createClient } from '@/lib/supabase/server';
import { UnauthorizedError } from '@/server/services/errors';
import type { AuthContext, UserRole } from './types';

/**
 * Resolves the current Supabase session into an AuthContext.
 *
 * Uses `supabase.auth.getUser()` which validates the JWT server-side.
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

  // Resolve app-level role from user metadata (set during Supabase sign-up/admin)
  // Falls back to 'customer' if not set.
  const role: UserRole =
    (user.user_metadata?.role as UserRole | undefined) ?? 'customer';

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
