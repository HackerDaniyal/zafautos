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
  // DEVELOPMENT BYPASS — Only works when AUTH_BYPASS=true
  // Resolves to the real admin user from the database so that
  // requirePermission() and RBAC work correctly with a valid user ID.
  if (process.env.AUTH_BYPASS === 'true') {
    // Look up the real admin user from the database
    const adminUser = await authRepo.findUserByEmail('admin@zafautos.com');
    if (adminUser) {
      const role: UserRole = (adminUser.role as string as UserRole) ?? 'customer';
      return {
        supabaseUser: { id: adminUser.id, email: adminUser.email } as AuthContext['supabaseUser'],
        userId: adminUser.id,
        email: adminUser.email,
        role,
      };
    }
    // Fallback: if no admin user exists (e.g., fresh DB), throw instead of using fake ID
    throw new UnauthorizedError(
      'AUTH_BYPASS enabled but no admin user found. Run seed or bootstrap-admin first.'
    );
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
