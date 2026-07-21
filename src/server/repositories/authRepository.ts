import { permissions, profiles, rolePermissions, roles, sessions, users } from '@/server/db/schema';
import { type InferModel, eq } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';

export class AuthRepository {
  public readonly users = new BaseRepository(users);
  public readonly roles = new BaseRepository(roles);
  public readonly permissions = new BaseRepository(permissions);
  public readonly sessions = new BaseRepository(sessions);
  public readonly profiles = new BaseRepository(profiles);
  public readonly rolePermissions = new BaseRepository(rolePermissions);

  async findUserByEmail(email: string) {
    const [user] = await this.users.getClient()
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async findUserById(id: string) {
    return this.users.findById(id);
  }

  async createUser(data: InferModel<typeof users, 'insert'>) {
    return this.users.create(data);
  }

  async findRoleBySlug(slug: string) {
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

  async findSessionByRefreshToken(refreshToken: string) {
    const [session] = await this.sessions.getClient()
      .select()
      .from(sessions)
      .where(eq(sessions.refreshToken, refreshToken))
      .limit(1);

    return session ?? null;
  }

  async createSession(data: InferModel<typeof sessions, 'insert'>) {
    return this.sessions.create(data);
  }

  async deleteSession(id: string) {
    return this.sessions.delete(id);
  }
}
