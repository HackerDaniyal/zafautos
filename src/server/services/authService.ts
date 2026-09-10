import { AuthRepository } from '@/server/repositories';
import { z } from 'zod';
import {
  UserAlreadyExistsError,
  UserNotFoundError,
  ValidationError,
} from './errors';

// ─── Validation Schemas ─────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['customer', 'dealer', 'admin', 'super_admin']).default('customer'),
  roleId: z.string().uuid('Invalid role ID').optional(),
});
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

// ─── Service Layer ──────────────────────────────────────────────────────────

/**
 * @deprecated Authentication is now handled by Supabase Auth via server actions.
 * This service is retained only for non-auth user lookups (admin, permissions).
 * Do NOT use for login, registration, or session management.
 */
export class AuthService {
  constructor(private readonly authRepo: AuthRepository = new AuthRepository()) {}

  /**
   * Retrieves a user by their email address.
   */
  async getUserByEmail(email: string) {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new UserNotFoundError(email);
    }
    return user;
  }

  /**
   * Retrieves a user by their ID.
   */
  async getUserById(id: string) {
    if (!id) {
      throw new ValidationError('User ID is required');
    }

    const user = await this.authRepo.findUserById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }

  /**
   * Creates a new user after verifying the email doesn't already exist.
   *
   * @deprecated Use the register() server action instead, which handles
   * Supabase Auth + DB sync with proper rollback.
   */
  async createUser(data: CreateUserDTO) {
    const validatedData = CreateUserSchema.parse(data);

    const existingUser = await this.authRepo.findUserByEmail(validatedData.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(validatedData.email);
    }

    return this.authRepo.createUser(validatedData);
  }

  /**
   * Retrieves a role by its slug.
   */
  async getRoleBySlug(slug: string) {
    if (!slug) {
      throw new ValidationError('Role slug is required');
    }
    return this.authRepo.findRoleBySlug(slug);
  }

  /**
   * Retrieves all available permissions.
   */
  async getPermissions() {
    return this.authRepo.getPermissions();
  }
}
