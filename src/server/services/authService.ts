import { AuthRepository } from '@/server/repositories';
import { z } from 'zod';
import {
  InvalidCredentialsError,
  SessionExpiredError,
  UserAlreadyExistsError,
  UserNotFoundError,
  ValidationError,
} from './errors';

// ─────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['customer', 'dealer', 'admin', 'super_admin']).default('customer'),
  roleId: z.string().uuid('Invalid role ID').optional(),
});
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

export const CreateSessionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  expiresAt: z.date(),
});
export type CreateSessionDTO = z.infer<typeof CreateSessionSchema>;

// ─────────────────────────────────────────────
// Service Layer
// ─────────────────────────────────────────────

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

  /**
   * Creates a new session for a user.
   */
  async createSession(data: CreateSessionDTO) {
    const validatedData = CreateSessionSchema.parse(data);
    return this.authRepo.createSession(validatedData);
  }

  /**
   * Retrieves a session by its refresh token.
   */
  async getSessionByRefreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    const session = await this.authRepo.findSessionByRefreshToken(refreshToken);
    if (!session) {
      throw new InvalidCredentialsError();
    }

    if (session.expiresAt < new Date()) {
      throw new SessionExpiredError();
    }

    return session;
  }

  /**
   * Deletes a session (logout).
   */
  async deleteSession(sessionId: string) {
    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }
    return this.authRepo.deleteSession(sessionId);
  }
}
