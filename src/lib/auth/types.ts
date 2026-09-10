import type { User } from '@supabase/supabase-js';

/**
 * The roles available in the ZafAutos system.
 * Must stay in sync with `userRoleEnum` in schema/common.ts.
 */
export type UserRole = 'customer' | 'dealer' | 'admin' | 'super_admin';

export type UserStatus = 'active' | 'pending' | 'suspended' | 'blocked';

/**
 * The authenticated user context injected into API route handlers.
 *
 * - `supabaseUser` â€” the raw Supabase Auth user object.
 * - `userId`       â€” the Supabase Auth user ID (UUID), used as the FK into `users`.
 * - `email`        â€” verified email from Supabase Auth.
 * - `role`         â€” the app-level role resolved from `users.role` in the database,
 *                    or defaulted to `customer` if not yet synced.
 */
export interface AuthContext {
  supabaseUser: User;
  userId: string;
  email: string;
  role: UserRole;
}
