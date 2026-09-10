import { AuthRepository } from '@/server/repositories';
import { db } from '@/server/db/client';
import { users, profiles } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { UserRole, UserStatus } from '@/lib/auth/types';

type UserRow = Awaited<ReturnType<AuthRepository['findUserById']>>;
type RoleRow = Awaited<ReturnType<AuthRepository['findRoleBySlug']>>;

/**
 * Single write-path for all user and profile mutations.
 *
 * Every place that needs to create, update, or soft-delete a user
 * MUST go through this service. This ensures:
 *   - Consistent transaction handling
 *   - Single place to add audit logging
 *   - Single place to add validation
 *   - No orphaned rows between users and profiles
 *
 * This service does NOT touch Supabase Auth — callers handle that.
 * This service does NOT enforce authorization — callers handle that.
 */
export class UserProvisioningService {
  constructor(private readonly authRepo: AuthRepository = new AuthRepository()) {}

  // ─── Lookups ──────────────────────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<UserRow> {
    return this.authRepo.findUserByEmail(email);
  }

  async findUserById(id: string): Promise<UserRow> {
    return this.authRepo.findUserById(id);
  }

  async findRoleBySlug(slug: string): Promise<RoleRow> {
    return this.authRepo.findRoleBySlug(slug);
  }

  async listUsers(options: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
  } = {}) {
    return this.authRepo.listUsers(options);
  }

  async hasSuperAdmin(): Promise<boolean> {
    return this.authRepo.hasSuperAdmin();
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  /**
   * Create user + profile rows atomically.
   *
   * The caller is responsible for:
   * 1. Creating the Supabase Auth user BEFORE calling this
   * 2. Handling compensation (deleting the auth user) if this throws
   */
  async provisionUser(data: {
    id: string;
    email: string;
    role: UserRole;
    status?: UserStatus;
    firstName?: string;
    lastName?: string;
  }): Promise<void> {
    const roleRecord = await this.authRepo.findRoleBySlug(data.role);

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: data.id,
        email: data.email,
        role: data.role,
        status: data.status ?? 'active',
        roleId: roleRecord?.id ?? null,
      });

      await tx.insert(profiles).values({
        userId: data.id,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
      });
    });
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async updateUserRole(
    targetUserId: string,
    role: UserRole,
  ): Promise<void> {
    const roleRecord = await this.authRepo.findRoleBySlug(role);

    await db
      .update(users)
      .set({
        role,
        roleId: roleRecord?.id ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId));
  }

  async updateUserStatus(
    targetUserId: string,
    status: UserStatus,
  ): Promise<void> {
    await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, targetUserId));
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  /**
   * Soft-delete a user. Marks as blocked and records who deleted it.
   * The caller should also remove the Supabase Auth user.
   */
  async softDeleteUser(
    targetUserId: string,
    deletedByUserId: string,
  ): Promise<void> {
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        deletedBy: deletedByUserId,
        status: 'blocked',
      })
      .where(eq(users.id, targetUserId));
  }
}
