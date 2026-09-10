'use server';

import { createClient } from '@/lib/supabase/server';
import { UserProvisioningService } from '@/server/services/userProvisioningService';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { requireRole } from '@/lib/auth/rbac';

const userService = new UserProvisioningService();

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
    const existing = await userService.hasSuperAdmin();

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

    const result = await userService.listUsers(options);

    return {
      success: true,
      data: {
        users: result.users.map((u) => ({
          ...u,
          role: u.role as string,
          status: u.status as string,
        })),
        total: result.total,
        page: result.page,
        limit: result.limit,
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
