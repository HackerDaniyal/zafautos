import type { User } from '@supabase/supabase-js';

/**
 * The roles available in the ZafAutos system.
 * Must stay in sync with `userRoleEnum` in schema/common.ts.
 */
export type UserRole = 'customer' | 'dealer' | 'admin' | 'super_admin';

/**
 * The authenticated user context injected into API route handlers.
 *
 * - `supabaseUser` — the raw Supabase Auth user object.
 * - `userId`       — the Supabase Auth user ID (UUID), used as the FK into `users`.
 * - `email`        — verified email from Supabase Auth.
 * - `role`         — the app-level role resolved from `users.role` in the database,
 *                    or defaulted to `customer` if not yet synced.
 */
export interface AuthContext {
  supabaseUser: User;
  userId: string;
  email: string;
  role: UserRole;
}
