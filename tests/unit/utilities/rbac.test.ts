import { describe, it, expect, vi } from 'vitest';

vi.mock('@/server/repositories', () => ({
  AuthRepository: class {
    findUserById = vi.fn();
    getUserPermissionSlugs = vi.fn();
  },
}));

import { hasRole, hasMinRole, requireRole, requireMinRole } from '@/lib/auth/rbac';
import { UnauthorizedError } from '@/server/services/errors';
import type { AuthContext } from '@/lib/auth/types';

function makeContext(role: string): AuthContext {
  return {
    supabaseUser: { id: 'user-1', email: 'test@example.com' } as any,
    userId: 'user-1',
    email: 'test@example.com',
    role: role as any,
  };
}

describe('hasRole', () => {
  it('returns true when user has the specified role', () => {
    expect(hasRole(makeContext('customer'), 'customer')).toBe(true);
  });

  it('returns false when user does not have the specified role', () => {
    expect(hasRole(makeContext('customer'), 'admin')).toBe(false);
  });

  it('returns true when user matches one of multiple roles', () => {
    expect(hasRole(makeContext('admin'), 'admin', 'super_admin')).toBe(true);
  });

  it('returns true for super_admin when checking super_admin', () => {
    const ctx = makeContext('super_admin');
    expect(hasRole(ctx, 'super_admin')).toBe(true);
  });

  it('returns false for super_admin when checking other specific roles', () => {
    const ctx = makeContext('super_admin');
    expect(hasRole(ctx, 'customer')).toBe(false);
    expect(hasRole(ctx, 'dealer')).toBe(false);
    expect(hasRole(ctx, 'admin')).toBe(false);
  });
});

describe('hasMinRole', () => {
  it('returns true when user role equals minRole', () => {
    expect(hasMinRole(makeContext('customer'), 'customer')).toBe(true);
  });

  it('returns false when user role is below minRole', () => {
    expect(hasMinRole(makeContext('customer'), 'admin')).toBe(false);
  });

  it('returns true when user role is above minRole', () => {
    expect(hasMinRole(makeContext('admin'), 'customer')).toBe(true);
  });

  it('returns true when user role exactly equals minRole', () => {
    expect(hasMinRole(makeContext('admin'), 'admin')).toBe(true);
  });

  it('returns false when user role is below minRole', () => {
    expect(hasMinRole(makeContext('admin'), 'super_admin')).toBe(false);
  });

  it('returns true for super_admin at super_admin level', () => {
    expect(hasMinRole(makeContext('super_admin'), 'super_admin')).toBe(true);
  });
});

describe('requireRole', () => {
  it('does not throw when user has the required role', () => {
    expect(() => requireRole(makeContext('customer'), 'customer')).not.toThrow();
  });

  it('throws UnauthorizedError when user lacks the required role', () => {
    expect(() => requireRole(makeContext('customer'), 'admin')).toThrow(UnauthorizedError);
  });
});

describe('requireMinRole', () => {
  it('does not throw when user meets the minimum role', () => {
    expect(() => requireMinRole(makeContext('dealer'), 'customer')).not.toThrow();
  });

  it('throws UnauthorizedError when user is below the minimum role', () => {
    expect(() => requireMinRole(makeContext('customer'), 'dealer')).toThrow(UnauthorizedError);
  });
});
