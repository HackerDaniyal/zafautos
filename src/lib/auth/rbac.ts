import { UnauthorizedError } from '@/server/services/errors';
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

/**
 * TODO: Phase 6 â€” Implement granular permission checks against the database.
 *
 * Currently a placeholder. In Phase 6, this will:
 * 1. Load the user's role permissions from `role_permissions` + `permissions` tables.
 * 2. Check if the given permission slug is granted to the user's role.
 */
export function requirePermission(
  _context: AuthContext,
  _permissionSlug: string
): void {
  // Pass-through until database permission lookup is implemented.
  void _context;
  void _permissionSlug;
  return;
}
