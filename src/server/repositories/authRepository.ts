import { permissions, profiles, rolePermissions, roles, users } from '@/server/db/schema';
import { type InferModel, eq, desc, count as drizzleCount, type SQL } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';

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

  async getPermissions() {
    return this.permissions.findAll();
  }

  async hasSuperAdmin(): Promise<boolean> {
    const [existing] = await this.users.getClient()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'super_admin'))
      .limit(1);

    return !!existing;
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
