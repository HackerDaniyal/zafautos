import { permissions, profiles, rolePermissions, roles, users } from '@/server/db/schema';
import { type InferModel, eq } from 'drizzle-orm';
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
}
