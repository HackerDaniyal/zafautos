import { UnauthorizedError } from '@/server/services/errors';
import { AuthRepository } from '@/server/repositories';
import type { AuthContext, UserRole } from './types';

/**
 * Role hierarchy â€” higher index = more privileges.
 * Used for `hasMinRole()` checks.
 */
const ROLE_HIERARCHY: UserRole[] = [
  'customer',
  'dealer',
  'admin',
  'super_admin',
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Boolean helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Returns true if the user has one of the specified roles.
 */
export function hasRole(
  context: AuthContext,
  ...roles: UserRole[]
): boolean {
  return roles.includes(context.role);
}

/**
 * Returns true if the user's role is at least `minRole` in the hierarchy.
 */
export function hasMinRole(
  context: AuthContext,
  minRole: UserRole
): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(context.role);
  const minIndex = ROLE_HIERARCHY.indexOf(minRole);
  return userIndex >= minIndex;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Throwing guards
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Throws UnauthorizedError if the user does NOT have one of the specified roles.
 */
export function requireRole(
  context: AuthContext,
  ...roles: UserRole[]
): void {
  if (!hasRole(context, ...roles)) {
    throw new UnauthorizedError(
      `Access denied. Required roles: ${roles.join(', ')}. Current role: ${context.role}`
    );
  }
}

/**
 * Throws UnauthorizedError if the user's role is below `minRole` in the hierarchy.
 */
export function requireMinRole(
  context: AuthContext,
  minRole: UserRole
): void {
  if (!hasMinRole(context, minRole)) {
    throw new UnauthorizedError(
      `Access denied. Minimum required role: ${minRole}. Current role: ${context.role}`
    );
  }
}

const authRepo = new AuthRepository();

/**
 * Throws UnauthorizedError if the user does NOT have the specified permission.
 *
 * Resolves permissions from the database via the user's assigned role:
 * 1. Looks up the user's `roleId` from the `users` table.
 * 2. Queries `role_permissions` + `permissions` to get granted slugs.
 * 3. If no role or no permissions assigned, the user gets only the base
 *    customer-level access (no granular permissions).
 */
export async function requirePermission(
  context: AuthContext,
  permissionSlug: string,
): Promise<void> {
  const user = await authRepo.findUserById(context.userId);
  if (!user || !user.roleId) {
    throw new UnauthorizedError(
      `Access denied. Required permission: ${permissionSlug}. No role assigned.`
    );
  }

  const slugs = await authRepo.getUserPermissionSlugs(context.userId);
  if (!slugs.includes(permissionSlug)) {
    throw new UnauthorizedError(
      `Access denied. Required permission: ${permissionSlug}. Current role: ${context.role}`
    );
  }
}
