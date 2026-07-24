'use server';

import { createClient } from '@/lib/supabase/server';
import { UserProvisioningService } from '@/server/services/userProvisioningService';
import { db } from '@/server/db/client';
import { users, profiles } from '@/server/db/schema';
import { eq, desc, count as drizzleCount } from 'drizzle-orm';
import { z } from 'zod';

const userService = new UserProvisioningService();

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

function handleError(error: unknown): { success: false; error: string; code?: string } {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors.map((e) => e.message).join('. '),
      code: 'VALIDATION_ERROR',
    };
  }
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  };
}

// ─── Bootstrap ──────────────────────────────────────────────────────────────

/**
 * Create the first Super Admin. Only works if no super_admin exists.
 */
export async function adminBootstrap(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<ActionResult> {
  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'super_admin'))
      .limit(1);

    if (existing) {
      return {
        success: false,
        error: 'A Super Admin already exists. Use the admin panel to create users.',
        code: 'ALREADY_EXISTS',
      };
    }

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });

    if (authError) {
      return { success: false, error: authError.message, code: 'AUTH_ERROR' };
    }

    if (!authData.user) {
      return { success: false, error: 'User creation failed', code: 'AUTH_ERROR' };
    }

    await userService.provisionUser({
      id: authData.user.id,
      email: data.email,
      role: 'super_admin',
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ─── User Invitation ────────────────────────────────────────────────────────

/**
 * Invite a user by email. Supabase sends an invitation email.
 * The invited user sets their password via the link.
 */
export async function inviteUser(data: {
  email: string;
  role: 'customer' | 'dealer' | 'admin';
  firstName?: string;
  lastName?: string;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
    }

    const caller = await userService.findUserById(user.id);
    if (!caller || (caller.role as string) !== 'super_admin') {
      return {
        success: false,
        error: 'Only administrators can invite users',
        code: 'UNAUTHORIZED',
      };
    }

    const existing = await userService.findUserByEmail(data.email);
    if (existing) {
      return {
        success: false,
        error: 'A user with this email already exists.',
        code: 'USER_ALREADY_EXISTS',
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo: `${appUrl}/auth/accept-invite`,
        data: {
          first_name: data.firstName ?? '',
          last_name: data.lastName ?? '',
          role: data.role,
        },
      }
    );

    if (inviteError) {
      return { success: false, error: inviteError.message, code: 'AUTH_ERROR' };
    }

    if (!inviteData.user) {
      return { success: false, error: 'Invitation failed', code: 'AUTH_ERROR' };
    }

    await userService.provisionUser({
      id: inviteData.user.id,
      email: data.email,
      role: data.role,
      status: 'pending',
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ─── User Management ────────────────────────────────────────────────────────

/**
 * List all users with pagination.
 */
export async function listUsers(options: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
} = {}): Promise<ActionResult<{
  users: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
    }

    const caller = await userService.findUserById(user.id);
    if (!caller || !['admin', 'super_admin'].includes(caller.role as string)) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }

    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    // Build query
    let query = db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      createdAt: users.createdAt,
    }).from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .$dynamic();

    // Count query
    let countQuery = db.select({ count: drizzleCount() }).from(users).$dynamic();

    // Apply filters
    if (options.role) {
      query = query.where(eq(users.role, options.role as 'customer' | 'dealer' | 'admin' | 'super_admin'));
      countQuery = countQuery.where(eq(users.role, options.role as 'customer' | 'dealer' | 'admin' | 'super_admin'));
    }

    if (options.status) {
      query = query.where(eq(users.status, options.status as 'active' | 'pending' | 'suspended' | 'blocked'));
      countQuery = countQuery.where(eq(users.status, options.status as 'active' | 'pending' | 'suspended' | 'blocked'));
    }

    const [data, [{ count: total }]] = await Promise.all([
      query.orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      countQuery,
    ]);

    return {
      success: true,
      data: {
        users: data.map((u) => ({
          ...u,
          role: u.role as string,
          status: u.status as string,
        })),
        total,
        page,
        limit,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Update a user's status (suspend, activate, block).
 */
export async function updateUserStatus(
  targetUserId: string,
  status: 'active' | 'suspended' | 'blocked'
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
    }

    const caller = await userService.findUserById(user.id);
    if (!caller || !['admin', 'super_admin'].includes(caller.role as string)) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }

    if (targetUserId === user.id) {
      return { success: false, error: 'Cannot modify your own account status', code: 'VALIDATION_ERROR' };
    }

    const target = await userService.findUserById(targetUserId);
    if (!target) {
      return { success: false, error: 'User not found', code: 'USER_NOT_FOUND' };
    }

    if ((target.role as string) === 'super_admin' && (caller.role as string) !== 'super_admin') {
      return { success: false, error: 'Only Super Admins can modify other Super Admins', code: 'UNAUTHORIZED' };
    }

    await userService.updateUserStatus(targetUserId, status);

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Delete a user (soft delete + remove from Supabase Auth).
 */
export async function deleteUser(targetUserId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
    }

    const caller = await userService.findUserById(user.id);
    if (!caller || (caller.role as string) !== 'super_admin') {
      return { success: false, error: 'Only Super Admins can delete users', code: 'UNAUTHORIZED' };
    }

    if (targetUserId === user.id) {
      return { success: false, error: 'Cannot delete your own account', code: 'VALIDATION_ERROR' };
    }

    await userService.softDeleteUser(targetUserId, user.id);

    const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      return { success: false, error: deleteError.message, code: 'AUTH_ERROR' };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Reset a user's password (sends reset email).
 */
export async function adminResetPassword(targetUserId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
    }

    const caller = await userService.findUserById(user.id);
    if (!caller || !['admin', 'super_admin'].includes(caller.role as string)) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }

    const target = await userService.findUserById(targetUserId);
    if (!target) {
      return { success: false, error: 'User not found', code: 'USER_NOT_FOUND' };
    }

    const { error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: target.email,
    });

    if (error) {
      return { success: false, error: error.message, code: 'AUTH_ERROR' };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Resend invitation to a pending user.
 */
export async function resendInvitation(targetUserId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
    }

    const caller = await userService.findUserById(user.id);
    if (!caller || !['admin', 'super_admin'].includes(caller.role as string)) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }

    const target = await userService.findUserById(targetUserId);
    if (!target) {
      return { success: false, error: 'User not found', code: 'USER_NOT_FOUND' };
    }

    if ((target.status as string) !== 'pending') {
      return { success: false, error: 'User is not pending invitation', code: 'VALIDATION_ERROR' };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.admin.inviteUserByEmail(target.email, {
      redirectTo: `${appUrl}/auth/accept-invite`,
    });

    if (error) {
      return { success: false, error: error.message, code: 'AUTH_ERROR' };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Update a user's role.
 */
export async function updateUserRole(
  targetUserId: string,
  role: 'customer' | 'dealer' | 'admin' | 'super_admin'
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
    }

    const caller = await userService.findUserById(user.id);
    if (!caller || (caller.role as string) !== 'super_admin') {
      return { success: false, error: 'Only Super Admins can change roles', code: 'UNAUTHORIZED' };
    }

    if (targetUserId === user.id) {
      return { success: false, error: 'Cannot change your own role', code: 'VALIDATION_ERROR' };
    }

    await userService.updateUserRole(targetUserId, role);

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
