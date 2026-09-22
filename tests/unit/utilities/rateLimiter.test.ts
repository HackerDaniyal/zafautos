import { describe, it, expect, vi, afterEach } from 'vitest';
import { RateLimitExceededError } from '@/lib/api/rateLimiter';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/env', () => ({
  validateEnv: vi.fn().mockReturnValue({
    DATABASE_URL: 'postgresql://test',
    SUPABASE_SERVICE_ROLE_KEY: 'test',
    NEXT_PUBLIC_APP_URL: 'http://localhost',
    NEXT_PUBLIC_APP_NAME: 'test',
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test',
    NODE_ENV: 'test',
  }),
}));

const mockReturning = vi.fn();

vi.mock('@/server/db/client', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => mockReturning()),
        }),
      }),
    }),
  },
}));

vi.mock('@/server/db/schema', () => ({
  rateLimits: {
    id: 'id',
    identifier: 'identifier',
    routeKey: 'routeKey',
    requestCount: 'requestCount',
    windowStart: 'windowStart',
    expiresAt: 'expiresAt',
  },
}));

const { enforceRateLimit, getRateLimitIdentifier } = await import('@/lib/api/rateLimiter');

describe('Rate Limiter', () => {
  afterEach(() => {
    mockReturning.mockClear();
  });

  describe('enforceRateLimit()', () => {
    it('allows request when under limit', async () => {
      mockReturning.mockResolvedValue([{ requestCount: 1 }]);
      await expect(enforceRateLimit('test-route', 'user-1', 100, 60000)).resolves.toBeUndefined();
    });

    it('allows request when at exactly the limit', async () => {
      mockReturning.mockResolvedValue([{ requestCount: 100 }]);
      await expect(enforceRateLimit('test-route', 'user-1', 100, 60000)).resolves.toBeUndefined();
    });

    it('throws RateLimitExceededError when over limit', async () => {
      mockReturning.mockResolvedValue([{ requestCount: 101 }]);
      await expect(enforceRateLimit('test-route', 'user-1', 100, 60000)).rejects.toThrow(
        RateLimitExceededError
      );
    });

    it('fails open when database throws error', async () => {
      const { db } = await import('@/server/db/client');
      (db.insert as any).mockImplementationOnce(() => { throw new Error('Connection refused'); });
      await expect(enforceRateLimit('test-route', 'user-1', 100, 60000)).resolves.toBeUndefined();
    });

    it('throws RateLimitExceededError for the correct route key', async () => {
      mockReturning.mockResolvedValue([{ requestCount: 101 }]);
      await expect(enforceRateLimit('analytics-events', '192.168.1.1', 100, 60000)).rejects.toThrow(
        RateLimitExceededError
      );
    });
  });

  describe('getRateLimitIdentifier()', () => {
    function makeRequest(headers: Record<string, string | null>): NextRequest {
      return {
        headers: {
          get: vi.fn((name: string) => headers[name] ?? null),
        },
      } as unknown as NextRequest;
    }

    it('returns first forwarded-for value', () => {
      const req = makeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
      expect(getRateLimitIdentifier(req)).toBe('1.2.3.4');
    });

    it('returns unknown when no forwarded-for header', () => {
      const req = makeRequest({});
      expect(getRateLimitIdentifier(req)).toBe('unknown');
    });
  });
});
