'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { providerMessage } from '@/lib/errors/providerMessage';
import { UserProvisioningService } from '@/server/services/userProvisioningService';
import { AuthRepository } from '@/server/repositories';
import { profiles } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { requireAuth } from '@/lib/auth/session';
import { hasMinRole } from '@/lib/auth/rbac';
import { UnauthorizedError } from '@/server/services/errors';
import { cookies } from 'next/headers';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ChangePasswordInput,
} from '@/lib/auth/validation';
import {
  enforceRateLimit,
  getServerActionRateLimitIdentifier,
  RateLimitExceededError,
} from '@/lib/api/rateLimiter';

const userService = new UserProvisioningService();

const ROLE_COOKIE = 'zaf_role';
const ROLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMITED_MESSAGE = 'Too many attempts. Please try again later.';

/**
 * Per-IP limit for auth server actions. Skips enforcement when no trusted
 * client IP is available (fail-open — consistent with DB fail-open behavior).
 */
async function limitAuthActionByIp(routeKey: string, limit: number): Promise<void> {
  const identifier = await getServerActionRateLimitIdentifier();
  if (!identifier) return;
  await enforceRateLimit(routeKey, identifier, limit, AUTH_RATE_WINDOW_MS);
}

function rateLimitedResult<T = unknown>(): ActionResult<T> {
  return { success: false, error: RATE_LIMITED_MESSAGE, code: 'RATE_LIMIT_EXCEEDED' };
}

async function setRoleCookie(role: string) {
  const store = await cookies();
  store.set(ROLE_COOKIE, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ROLE_COOKIE_MAX_AGE,
  });
}

async function clearRoleCookie() {
  const store = await cookies();
  store.set(ROLE_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}

/**
 * Sign in with email and password.
 * Returns the user's role from the database for redirect.
 */
export async function login(data: LoginInput): Promise<ActionResult<{ role: string }>> {
  try {
    // Per-IP brute-force bound (before any auth work).
    await limitAuthActionByIp('auth-login-ip', 10);

    const validated = loginSchema.parse(data);

    // Per-target bound: stops distributed attempts concentrated on one account.
    await enforceRateLimit(
      'auth-login-email',
      `email:${validated.email.toLowerCase().trim()}`.slice(0, 255),
      10,
      AUTH_RATE_WINDOW_MS
    );

    const supabase = await createClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Please verify your email address before signing in.',
          code: 'EMAIL_NOT_CONFIRMED',
        };
      }
      return { success: false, error: providerMessage(error.message, 'Unable to sign in. Please try again.'), code: 'AUTH_ERROR' };
    }

    const dbUser = await userService.findUserById(authData.user.id);
    const role = (dbUser?.role as string) ?? 'customer';

    try { await setRoleCookie(role); } catch { /* non-fatal */ }

    return { success: true, data: { role } };
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitedResult();
    return handleError(error);
  }
}

/**
 * Register a new user.
 *
 * Flow:
 * 1. Create Supabase Auth user
 * 2. Begin Drizzle transaction → insert users + profiles
 * 3. Commit
 * 4. On ANY failure → delete the Supabase Auth user (compensating rollback)
 *
 * This ensures no orphaned auth accounts or partial DB state.
 */
export async function register(data: RegisterInput): Promise<ActionResult> {
  let authUserId: string | null = null;

  try {
    await limitAuthActionByIp('auth-register', 5);

    const validated = registerSchema.parse(data);
    const supabase = await createClient();

    const existingUser = await userService.findUserByEmail(validated.email);
    if (existingUser) {
      // Non-enumerating: identical success response as a fresh registration.
      return { success: true, data: undefined };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          first_name: validated.firstName,
          last_name: validated.lastName,
        },
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (authError) {
      // Do not surface provider-specific messages (may reveal account existence).
      return { success: false, error: 'Registration failed. Please try again.', code: 'AUTH_ERROR' };
    }

    if (!authData.user) {
      return { success: false, error: 'Registration failed. Please try again.', code: 'AUTH_ERROR' };
    }

    authUserId = authData.user.id;

    await userService.provisionUser({
      id: authUserId,
      email: validated.email,
      role: 'customer',
      firstName: validated.firstName,
      lastName: validated.lastName,
    });

    try { await setRoleCookie('customer'); } catch { /* non-fatal */ }

    return { success: true, data: undefined };
  } catch (error) {
    if (authUserId) {
      try {
        const supabase = createServiceRoleClient();
        await supabase.auth.admin.deleteUser(authUserId);
      } catch {
        // Best-effort cleanup
      }
    }
    if (error instanceof RateLimitExceededError) return rateLimitedResult();
    return handleError(error);
  }
}

/**
 * Sign out the current user.
 */
export async function logout(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: providerMessage(error.message, 'Unable to sign out. Please try again.'), code: 'AUTH_ERROR' };
    }

    try { await clearRoleCookie(); } catch { /* non-fatal */ }

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Send a password reset email.
 */
export async function forgotPassword(data: ForgotPasswordInput): Promise<ActionResult> {
  try {
    await limitAuthActionByIp('auth-forgot-password', 5);

    const validated = forgotPasswordSchema.parse(data);
    const supabase = await createClient();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
      redirectTo: `${appUrl}/reset-password`,
    });

    if (error) {
      return { success: false, error: providerMessage(error.message, 'Unable to send the password reset email. Please try again later.'), code: 'AUTH_ERROR' };
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitedResult();
    return handleError(error);
  }
}

/**
 * Reset password from email link.
 * Requires an active recovery session (set by the reset link).
 */
export async function resetPassword(data: ResetPasswordInput): Promise<ActionResult> {
  try {
    const validated = resetPasswordSchema.parse(data);
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: validated.password,
    });

    if (error) {
      return { success: false, error: providerMessage(error.message, 'Unable to reset the password. Please try again.'), code: 'AUTH_ERROR' };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Change password for authenticated user.
 * Requires current password verification.
 */
export async function changePassword(data: ChangePasswordInput): Promise<ActionResult> {
  try {
    await limitAuthActionByIp('auth-change-password', 10);

    const validated = changePasswordSchema.parse(data);
    const supabase = await createClient();

    // Verify current password by re-authenticating
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (getUserError || !user || !user.email) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
    }

    // Re-authenticate with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: validated.currentPassword,
    });

    if (signInError) {
      return {
        success: false,
        error: 'Current password is incorrect',
        code: 'INVALID_CREDENTIALS',
      };
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validated.newPassword,
    });

    if (updateError) {
      return { success: false, error: providerMessage(updateError.message, 'Unable to update the password. Please try again.'), code: 'AUTH_ERROR' };
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitedResult();
    return handleError(error);
  }
}

/**
 * Resend email verification.
 */
export async function resendVerification(email: string): Promise<ActionResult> {
  try {
    await limitAuthActionByIp('auth-resend-verification', 5);

    if (!email) {
      return { success: false, error: 'Email is required', code: 'VALIDATION_ERROR' };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { success: false, error: providerMessage(error.message, 'Unable to send the verification email. Please try again later.'), code: 'AUTH_ERROR' };
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitedResult();
    return handleError(error);
  }
}

/**
 * Get the current user's session and role from the database.
 */
export async function getCurrentSession(): Promise<ActionResult<{ role: string; userId: string; email: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
    }

    const dbUser = await userService.findUserById(user.id);
    const role = (dbUser?.role as string) ?? 'customer';

    return {
      success: true,
      data: {
        role,
        userId: user.id,
        email: user.email,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Get the default dashboard path for the current user based on their DB role.
 * Used by login/register forms to redirect directly to the right portal.
 */
export async function getDefaultDashboard(): Promise<ActionResult<{ path: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return { success: true, data: { path: '/login' } };
    }

    const dbUser = await userService.findUserById(user.id);
    const role = (dbUser?.role as string) ?? 'customer';

    switch (role) {
      case 'super_admin':
      case 'admin':
        return { success: true, data: { path: '/admin' } };
      case 'dealer':
        return { success: true, data: { path: '/dealer' } };
      default:
        return { success: true, data: { path: '/customer' } };
    }
  } catch {
    return { success: true, data: { path: '/customer' } };
  }
}

/**
 * Create a user as admin (Super Admin only).
 *
 * Flow:
 * 1. Verify caller is super_admin
 * 2. Create Supabase Auth user (admin API, bypasses email confirmation)
 * 3. Begin Drizzle transaction → insert users + profiles
 * 4. Commit
 * 5. On ANY failure → delete the Supabase Auth user (compensating rollback)
 */
export async function adminCreateUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'dealer' | 'admin' | 'super_admin';
}): Promise<ActionResult> {
  let authUserId: string | null = null;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (getUserError || !user) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
    }

    const dbUser = await userService.findUserById(user.id);
    if (!dbUser || (dbUser.role as string) !== 'super_admin') {
      return {
        success: false,
        error: 'Only super administrators can create users',
        code: 'UNAUTHORIZED',
      };
    }

    const { data: authData, error: authError } = await createServiceRoleClient().auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });

    if (authError) {
      // Super-admin createUser: avoid leaking provider internals.
      return { success: false, error: 'User creation failed', code: 'AUTH_ERROR' };
    }

    if (!authData.user) {
      return { success: false, error: 'User creation failed', code: 'AUTH_ERROR' };
    }

    authUserId = authData.user.id;

    await userService.provisionUser({
      id: authUserId,
      email: data.email,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (authUserId) {
      try {
        const supabase = createServiceRoleClient();
        await supabase.auth.admin.deleteUser(authUserId);
      } catch {
        // Best-effort cleanup
      }
    }
    return handleError(error);
  }
}

/**
 * Get a user's profile by their user ID.
 * Used by dashboard pages to avoid direct DB access in Server Components.
 */
export async function getProfileByUserId(userId: string): Promise<ActionResult<{ firstName: string | null; lastName: string | null; avatarUrl: string | null } | null>> {
  try {
    const auth = await requireAuth();
    if (auth.userId !== userId && !hasMinRole(auth, 'admin')) {
      throw new UnauthorizedError('Access denied: cannot view other profiles');
    }

    const authRepo = new AuthRepository();
    const [profile] = await authRepo.profiles.getClient()
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    return {
      success: true,
      data: profile
        ? { firstName: profile.firstName ?? null, lastName: profile.lastName ?? null, avatarUrl: profile.avatarUrl ?? null }
        : null,
    };
  } catch (error) {
    return handleError(error);
  }
}
