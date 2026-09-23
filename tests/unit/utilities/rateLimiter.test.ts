import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
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

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

const mockReturning = vi.fn();
const mockExecute = vi.fn();

vi.mock('@/server/db/client', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => mockReturning()),
        }),
      }),
    }),
    execute: vi.fn((...args: unknown[]) => mockExecute(...args)),
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

const {
  enforceRateLimit,
  getRateLimitIdentifier,
  getRateLimitIdentifierAuthenticated,
  getServerActionRateLimitIdentifier,
  cleanupExpiredRateLimits,
  enforceFileUploadRateLimit,
  RATE_LIMIT_CLEANUP_PROBABILITY,
} = await import('@/lib/api/rateLimiter');

let randomSpy: ReturnType<typeof vi.spyOn>;

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Keep opportunistic cleanup deterministic (never fires) unless a test opts in.
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1);
  });

  afterEach(() => {
    randomSpy.mockRestore();
    mockReturning.mockClear();
    mockExecute.mockClear();
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

  describe('getRateLimitIdentifierAuthenticated()', () => {
    it('keys the bucket by user ID, not IP', () => {
      expect(getRateLimitIdentifierAuthenticated('u-1')).toBe('user:u-1');
    });
  });

  describe('getServerActionRateLimitIdentifier()', () => {
    it('returns first forwarded-for hop from next/headers', async () => {
      const { headers } = await import('next/headers');
      (headers as Mock).mockResolvedValueOnce({
        get: (name: string) => (name === 'x-forwarded-for' ? '7.7.7.7, 8.8.8.8' : null),
      });
      await expect(getServerActionRateLimitIdentifier()).resolves.toBe('7.7.7.7');
    });

    it('returns null when x-forwarded-for is absent (no shared bucket)', async () => {
      const { headers } = await import('next/headers');
      (headers as Mock).mockResolvedValueOnce({ get: () => null });
      await expect(getServerActionRateLimitIdentifier()).resolves.toBeNull();
    });

    it('returns null when headers() throws (outside request scope)', async () => {
      const { headers } = await import('next/headers');
      (headers as Mock).mockRejectedValueOnce(new Error('outside request'));
      await expect(getServerActionRateLimitIdentifier()).resolves.toBeNull();
    });
  });

  describe('cleanupExpiredRateLimits()', () => {
    it('issues a batched DELETE restricted to expired rows', async () => {
      mockExecute.mockResolvedValueOnce([]);
      await expect(cleanupExpiredRateLimits()).resolves.toBeUndefined();
      expect(mockExecute).toHaveBeenCalledTimes(1);
      const sqlObj = (mockExecute as Mock).mock.calls[0]![0] as {
        queryChunks?: unknown[];
      };
      const sqlText = (sqlObj.queryChunks ?? [])
        .map((chunk) => {
          if (typeof chunk === 'string') return chunk;
          if (
            chunk &&
            typeof chunk === 'object' &&
            'value' in chunk &&
            Array.isArray((chunk as { value: unknown[] }).value)
          ) {
            return (chunk as { value: unknown[] }).value.map(String).join('');
          }
          return '';
        })
        .join('');
      expect(sqlText).toContain('DELETE FROM rate_limits');
      expect(sqlText).toContain('expires_at');
      expect(sqlText).toContain('LIMIT');
    });

    it('propagates database errors to explicit callers', async () => {
      mockExecute.mockRejectedValueOnce(new Error('db down'));
      await expect(cleanupExpiredRateLimits()).rejects.toThrow('db down');
    });
  });

  describe('opportunistic cleanup trigger', () => {
    it(`fires when random < RATE_LIMIT_CLEANUP_PROBABILITY (${RATE_LIMIT_CLEANUP_PROBABILITY})`, async () => {
      randomSpy.mockReturnValue(0);
      mockReturning.mockResolvedValueOnce([{ requestCount: 1 }]);
      mockExecute.mockResolvedValueOnce([]);
      await enforceRateLimit('test-route', 'user-1', 100, 60000);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('does not fire when random is above the probability', async () => {
      randomSpy.mockReturnValue(0.5);
      mockReturning.mockResolvedValueOnce([{ requestCount: 1 }]);
      await enforceRateLimit('test-route', 'user-1', 100, 60000);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('never fails a successful request when cleanup throws', async () => {
      randomSpy.mockReturnValue(0);
      mockReturning.mockResolvedValueOnce([{ requestCount: 1 }]);
      mockExecute.mockRejectedValueOnce(new Error('cleanup failed'));
      await expect(enforceRateLimit('test-route', 'user-1', 100, 60000)).resolves.toBeUndefined();
    });

    it('does not run cleanup when the limit is exceeded', async () => {
      randomSpy.mockReturnValue(0);
      mockReturning.mockResolvedValueOnce([{ requestCount: 101 }]);
      await expect(enforceRateLimit('test-route', 'user-1', 100, 60000)).rejects.toThrow(
        RateLimitExceededError
      );
      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe('enforceFileUploadRateLimit()', () => {
    it('uses the shared file-uploads route key bucketed per user with a 15-minute window', async () => {
      mockReturning.mockResolvedValueOnce([{ requestCount: 1 }]);
      await expect(enforceFileUploadRateLimit('user-123')).resolves.toBeUndefined();

      const { db } = await import('@/server/db/client');
      const insertMock = db.insert as unknown as Mock;
      const chain = insertMock.mock.results[insertMock.mock.results.length - 1]!.value;
      const valuesArg = chain.values.mock.calls[chain.values.mock.calls.length - 1]![0];

      expect(valuesArg.routeKey).toBe('file-uploads');
      expect(valuesArg.identifier).toBe('user:user-123');
      expect(valuesArg.expiresAt.getTime() - valuesArg.windowStart.getTime()).toBe(15 * 60 * 1000);
    });

    it('propagates RateLimitExceededError when the shared bucket is exhausted', async () => {
      mockReturning.mockResolvedValueOnce([{ requestCount: 61 }]);
      await expect(enforceFileUploadRateLimit('user-123')).rejects.toThrow(RateLimitExceededError);
    });
  });
});
