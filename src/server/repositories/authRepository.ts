import { permissions, profiles, rolePermissions, roles, users } from '@/server/db/schema';
import { type InferModel, eq, desc, asc, count as drizzleCount, sql, type SQL, and, inArray } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';
import { db } from '@/server/db/client';

type UserRow = InferModel<typeof users>;
type RoleRow = InferModel<typeof roles>;

export class AuthRepository {
  public readonly users = new BaseRepository(users);
  public readonly roles = new BaseRepository(roles);
  public readonly permissions = new BaseRepository(permissions);
  public readonly profiles = new BaseRepository(profiles);
  public readonly rolePermissions = new BaseRepository(rolePermissions);

  async findUserByEmail(email: string): Promise<UserRow | null> {
    const [user] = await this.users.getClient()
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async findUserById(id: string): Promise<UserRow | null> {
    const [user] = await this.users.getClient()
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  async createUser(data: InferModel<typeof users, 'insert'>) {
    return this.users.create(data);
  }

  async findRoleBySlug(slug: string): Promise<RoleRow | null> {
    const [role] = await this.roles.getClient()
      .select()
      .from(roles)
      .where(eq(roles.slug, slug))
      .limit(1);

    return role ?? null;
  }

  async findRoleById(id: string): Promise<RoleRow | null> {
    const [role] = await this.roles.getClient()
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    return role ?? null;
  }

  async getPermissions(): Promise<{ id: string; name: string; slug: string; description: string | null }[]> {
    return this.permissions.findAll() as Promise<{ id: string; name: string; slug: string; description: string | null }[]>;
  }

  async hasSuperAdmin(): Promise<boolean> {
    const [existing] = await this.users.getClient()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'super_admin'))
      .limit(1);

    return !!existing;
  }

  async countUsersByRoleId(roleId: string): Promise<number> {
    const [{ count }] = await this.users.getClient()
      .select({ count: drizzleCount() })
      .from(users)
      .where(eq(users.roleId, roleId));

    return count;
  }

  async listRoles() {
    const allRoles = await this.roles.getClient()
      .select()
      .from(roles)
      .where(sql`${roles.deletedAt} IS NULL`)
      .orderBy(asc(roles.name));

    const rolesWithCounts = await Promise.all(
      allRoles.map(async (role) => {
        const [userCount] = await this.users.getClient()
          .select({ count: drizzleCount() })
          .from(users)
          .where(eq(users.roleId, role.id));

        const [permCount] = await this.rolePermissions.getClient()
          .select({ count: drizzleCount() })
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, role.id));

        return {
          ...role,
          userCount: userCount.count,
          permissionCount: permCount.count,
        };
      })
    );

    return rolesWithCounts;
  }

  async getRolePermissions(roleId: string) {
    const assigned = await this.rolePermissions.getClient()
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    return assigned.map((r) => r.permissionId);
  }

  async getUserPermissionSlugs(userId: string): Promise<string[]> {
    const user = await this.findUserById(userId);
    if (!user || !user.roleId) return [];

    const assigned = await this.rolePermissions.getClient()
      .select({ slug: permissions.slug })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    return assigned.map((r) => r.slug);
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      if (permissionIds.length > 0) {
        await tx.insert(rolePermissions).values(
          permissionIds.map((pid) => ({
            roleId,
            permissionId: pid,
          }))
        );
      }
    });
  }

  async listUsers(options: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
  } = {}) {
    const { page = 1, limit = 20, role, status } = options;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (role) {
      conditions.push(eq(users.role, role as 'customer' | 'dealer' | 'admin' | 'super_admin'));
    }
    if (status) {
      conditions.push(eq(users.status, status as 'active' | 'pending' | 'suspended' | 'blocked'));
    }

    const whereClause = conditions.length > 0 ? conditions.reduce((a, b) => b) : undefined;

    const [data, [{ count: total }]] = await Promise.all([
      this.users.getClient()
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          status: users.status,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      this.users.getClient()
        .select({ count: drizzleCount() })
        .from(users)
        .where(whereClause),
    ]);

    return {
      users: data.map((u) => ({
        ...u,
        role: u.role as string,
        status: u.status as string,
      })),
      total,
      page,
      limit,
    };
  }
}
