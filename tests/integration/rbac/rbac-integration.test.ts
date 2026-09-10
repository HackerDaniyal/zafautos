import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AuthContext } from '@/lib/auth/types';

const mockFindUserById = vi.fn();
const mockGetUserPermissionSlugs = vi.fn();

vi.mock('@/server/repositories', () => ({
  AuthRepository: vi.fn().mockImplementation(function () {
    return {
      findUserById: mockFindUserById,
      getUserPermissionSlugs: mockGetUserPermissionSlugs,
    };
  }),
}));

function buildAuthContext(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    supabaseUser: { id: overrides.userId ?? 'user-001', email: overrides.email ?? 'user@test.com' } as any,
    userId: overrides.userId ?? 'user-001',
    email: overrides.email ?? 'user@test.com',
    role: overrides.role ?? 'customer',
  };
}

describe('RBAC - requirePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls authRepo.getUserPermissionSlugs with the correct userId', async () => {
    const ctx = buildAuthContext({ userId: 'user-abc' });
    mockFindUserById.mockResolvedValue({ id: 'user-abc', roleId: 'role-1' });
    mockGetUserPermissionSlugs.mockResolvedValue(['orders.read']);

    const { requirePermission } = await import('@/lib/auth/rbac');
    await requirePermission(ctx, 'orders.read');

    expect(mockGetUserPermissionSlugs).toHaveBeenCalledWith('user-abc');
  });

  it('throws when user has no roleId', async () => {
    const ctx = buildAuthContext();
    mockFindUserById.mockResolvedValue({ id: 'user-001', roleId: null });

    const { requirePermission } = await import('@/lib/auth/rbac');

    await expect(requirePermission(ctx, 'orders.read')).rejects.toThrow('No role assigned');
  });

  it('throws when user is not found in database', async () => {
    const ctx = buildAuthContext({ userId: 'nonexistent' });
    mockFindUserById.mockResolvedValue(null);

    const { requirePermission } = await import('@/lib/auth/rbac');

    await expect(requirePermission(ctx, 'orders.read')).rejects.toThrow('No role assigned');
  });

  it('throws when permission slug is missing from user permissions', async () => {
    const ctx = buildAuthContext();
    mockFindUserById.mockResolvedValue({ id: 'user-001', roleId: 'role-1' });
    mockGetUserPermissionSlugs.mockResolvedValue(['orders.read', 'orders.write']);

    const { requirePermission } = await import('@/lib/auth/rbac');

    await expect(requirePermission(ctx, 'admin.dashboard')).rejects.toThrow('Access denied');
    await expect(requirePermission(ctx, 'admin.dashboard')).rejects.toThrow('admin.dashboard');
  });

  it('succeeds when permission slug exists in user permissions', async () => {
    const ctx = buildAuthContext();
    mockFindUserById.mockResolvedValue({ id: 'user-001', roleId: 'role-1' });
    mockGetUserPermissionSlugs.mockResolvedValue(['orders.read', 'orders.write', 'vehicles.read']);

    const { requirePermission } = await import('@/lib/auth/rbac');

    await expect(requirePermission(ctx, 'orders.read')).resolves.toBeUndefined();
    await expect(requirePermission(ctx, 'vehicles.read')).resolves.toBeUndefined();
  });

  it('includes role name in error message', async () => {
    const ctx = buildAuthContext({ role: 'dealer' });
    mockFindUserById.mockResolvedValue({ id: 'user-001', roleId: 'role-1' });
    mockGetUserPermissionSlugs.mockResolvedValue([]);

    const { requirePermission } = await import('@/lib/auth/rbac');

    try {
      await requirePermission(ctx, 'super_admin.access');
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).toContain('dealer');
      expect(err.message).toContain('super_admin.access');
    }
  });
});

describe('RBAC - hasRole', () => {
  it('returns true when user has the specified role', async () => {
    const { hasRole } = await import('@/lib/auth/rbac');
    const ctx = buildAuthContext({ role: 'admin' });

    expect(hasRole(ctx, 'admin')).toBe(true);
  });

  it('returns false when user does not have the specified role', async () => {
    const { hasRole } = await import('@/lib/auth/rbac');
    const ctx = buildAuthContext({ role: 'customer' });

    expect(hasRole(ctx, 'admin')).toBe(false);
  });

  it('returns true when user matches one of multiple roles', async () => {
    const { hasRole } = await import('@/lib/auth/rbac');
    const ctx = buildAuthContext({ role: 'admin' });

    expect(hasRole(ctx, 'customer', 'admin', 'super_admin')).toBe(true);
  });
});

describe('RBAC - requireRole', () => {
  it('does not throw when user has required role', async () => {
    const { requireRole } = await import('@/lib/auth/rbac');
    const ctx = buildAuthContext({ role: 'super_admin' });

    expect(() => requireRole(ctx, 'super_admin')).not.toThrow();
  });

  it('throws when user does not have required role', async () => {
    const { requireRole } = await import('@/lib/auth/rbac');
    const ctx = buildAuthContext({ role: 'customer' });

    expect(() => requireRole(ctx, 'admin')).toThrow('Access denied');
  });
});

describe('RBAC - hasMinRole', () => {
  it('returns true when user role is at or above minimum', async () => {
    const { hasMinRole } = await import('@/lib/auth/rbac');

    expect(hasMinRole(buildAuthContext({ role: 'super_admin' }), 'admin')).toBe(true);
    expect(hasMinRole(buildAuthContext({ role: 'admin' }), 'admin')).toBe(true);
    expect(hasMinRole(buildAuthContext({ role: 'super_admin' }), 'customer')).toBe(true);
  });

  it('returns false when user role is below minimum', async () => {
    const { hasMinRole } = await import('@/lib/auth/rbac');

    expect(hasMinRole(buildAuthContext({ role: 'customer' }), 'admin')).toBe(false);
    expect(hasMinRole(buildAuthContext({ role: 'dealer' }), 'super_admin')).toBe(false);
  });
});
