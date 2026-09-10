import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFindUserByEmail = vi.fn();
const mockFindUserById = vi.fn();

vi.mock('@/server/repositories', () => ({
  AuthRepository: vi.fn().mockImplementation(function () {
    return {
      findUserByEmail: mockFindUserByEmail,
      findUserById: mockFindUserById,
    };
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const mockSupabaseUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@test.com',
};

describe('Auth - getSession', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns AuthContext when supabase session is valid', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockSupabaseUser },
          error: null,
        }),
      },
    });

    mockFindUserById.mockResolvedValue({
      id: mockSupabaseUser.id,
      email: mockSupabaseUser.email,
      role: 'admin',
    });

    const { getSession } = await import('@/lib/auth/session');
    const ctx = await getSession();

    expect(ctx).not.toBeNull();
    expect(ctx!.userId).toBe(mockSupabaseUser.id);
    expect(ctx!.email).toBe(mockSupabaseUser.email);
    expect(ctx!.role).toBe('admin');
  });

  it('returns null when supabase session has an error', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid JWT' },
        }),
      },
    });

    const { getSession } = await import('@/lib/auth/session');
    const ctx = await getSession();

    expect(ctx).toBeNull();
  });

  it('returns null when supabase user has no email', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'some-id', email: null } },
          error: null,
        }),
      },
    });

    const { getSession } = await import('@/lib/auth/session');
    const ctx = await getSession();

    expect(ctx).toBeNull();
  });

  it('defaults role to customer when dbUser has no role', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockSupabaseUser },
          error: null,
        }),
      },
    });

    mockFindUserById.mockResolvedValue({ id: mockSupabaseUser.id, role: null });

    const { getSession } = await import('@/lib/auth/session');
    const ctx = await getSession();

    expect(ctx!.role).toBe('customer');
  });
});

describe('Auth - requireAuth', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws UnauthorizedError when session is null', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'No session' },
        }),
      },
    });

    const { requireAuth } = await import('@/lib/auth/session');

    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });

  it('returns AuthContext when session exists', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockSupabaseUser },
          error: null,
        }),
      },
    });

    mockFindUserById.mockResolvedValue({
      id: mockSupabaseUser.id,
      email: mockSupabaseUser.email,
      role: 'super_admin',
    });

    const { requireAuth } = await import('@/lib/auth/session');
    const ctx = await requireAuth();

    expect(ctx).toBeDefined();
    expect(ctx.role).toBe('super_admin');
  });
});

describe('Auth - AUTH_BYPASS', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('bypasses session check in development when AUTH_BYPASS=true', async () => {
    process.env.AUTH_BYPASS = 'true';
    (process.env as Record<string, string>).NODE_ENV = 'development';

    mockFindUserByEmail.mockResolvedValue({
      id: 'admin-uuid-001',
      email: 'admin@zafautos.com',
      role: 'super_admin',
    });

    const { requireAuth } = await import('@/lib/auth/session');
    const ctx = await requireAuth();

    expect(mockFindUserByEmail).toHaveBeenCalledWith('admin@zafautos.com');
    expect(ctx.userId).toBe('admin-uuid-001');
    expect(ctx.email).toBe('admin@zafautos.com');
    expect(ctx.role).toBe('super_admin');
  });

  it('throws when AUTH_BYPASS=true but no admin user exists', async () => {
    process.env.AUTH_BYPASS = 'true';
    (process.env as Record<string, string>).NODE_ENV = 'development';

    mockFindUserByEmail.mockResolvedValue(null);

    const { requireAuth } = await import('@/lib/auth/session');

    await expect(requireAuth()).rejects.toThrow('AUTH_BYPASS');
  });

  it('does NOT bypass in production even with AUTH_BYPASS=true', async () => {
    process.env.AUTH_BYPASS = 'true';
    (process.env as Record<string, string>).NODE_ENV = 'production';

    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'No session' },
        }),
      },
    });

    const { requireAuth } = await import('@/lib/auth/session');

    await expect(requireAuth()).rejects.toThrow('Unauthorized');
    expect(mockFindUserByEmail).not.toHaveBeenCalled();
  });

  it('does NOT bypass when AUTH_BYPASS is not set', async () => {
    delete process.env.AUTH_BYPASS;
    (process.env as Record<string, string>).NODE_ENV = 'development';

    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'No session' },
        }),
      },
    });

    const { requireAuth } = await import('@/lib/auth/session');

    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });
});

describe('Auth - service-role credentials from env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('reads SUPABASE_SERVICE_ROLE_KEY from process.env', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-role-key');
  });

  it('reads SUPABASE_URL from process.env', () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    expect(process.env.SUPABASE_URL).toBe('https://test.supabase.co');
  });

  it('service-role key is undefined when not set', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });
});
