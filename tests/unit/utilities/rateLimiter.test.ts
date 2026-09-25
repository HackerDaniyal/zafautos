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
  getTrustedClientIp,
  normalizeClientIp,
  cleanupExpiredRateLimits,
  enforceFileUploadRateLimit,
  MAX_IDENTIFIER_LENGTH,
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

  describe('getRateLimitIdentifier() — trusted client-IP model', () => {
    function makeRequest(headers: Record<string, string | null>): NextRequest {
      return {
        headers: {
          get: vi.fn((name: string) => headers[name] ?? null),
        },
      } as unknown as NextRequest;
    }

    it('uses cf-connecting-ip as the canonical client IP', () => {
      const req = makeRequest({ 'cf-connecting-ip': '1.2.3.4' });
      expect(getRateLimitIdentifier(req)).toBe('1.2.3.4');
    });

    it('falls back to x-real-ip when cf-connecting-ip is absent', () => {
      const req = makeRequest({ 'x-real-ip': '5.6.7.8' });
      expect(getRateLimitIdentifier(req)).toBe('5.6.7.8');
    });

    it('falls back to x-vercel-forwarded-for when the higher-priority headers are absent', () => {
      const req = makeRequest({ 'x-vercel-forwarded-for': '9.8.7.6' });
      expect(getRateLimitIdentifier(req)).toBe('9.8.7.6');
    });

    it('never reads x-forwarded-for — a client-controlled header cannot select the bucket', () => {
      const req = makeRequest({ 'x-forwarded-for': '1.2.3.4' });
      expect(getRateLimitIdentifier(req)).toBeNull();
    });

    it('multi-entry XFF cannot mint attacker-chosen leftmost buckets', () => {
      const req = makeRequest({
        'x-forwarded-for': 'attacker-1, attacker-2, 10.0.0.1',
        'cf-connecting-ip': '198.51.100.7',
      });
      expect(getRateLimitIdentifier(req)).toBe('198.51.100.7');
    });

    it('for comma-separated trusted values only the rightmost hop is used', () => {
      const req = makeRequest({ 'x-vercel-forwarded-for': '203.0.113.9, 198.51.100.7' });
      expect(getRateLimitIdentifier(req)).toBe('198.51.100.7');
    });

    it('accepts valid IPv4 and IPv6 literals', () => {
      const v4 = makeRequest({ 'cf-connecting-ip': '203.0.113.42' });
      const v6 = makeRequest({ 'cf-connecting-ip': '2001:db8::1' });
      const v6Mapped = makeRequest({ 'cf-connecting-ip': '::ffff:192.0.2.1' });
      expect(getRateLimitIdentifier(v4)).toBe('203.0.113.42');
      expect(getRateLimitIdentifier(v6)).toBe('2001:db8::1');
      expect(getRateLimitIdentifier(v6Mapped)).toBe('::ffff:192.0.2.1');
    });

    it('rejects invalid, empty, control-character and oversized header values', () => {
      expect(getRateLimitIdentifier(makeRequest({ 'cf-connecting-ip': 'not-an-ip' }))).toBeNull();
      expect(getRateLimitIdentifier(makeRequest({ 'cf-connecting-ip': '   ' }))).toBeNull();
      expect(
        getRateLimitIdentifier(makeRequest({ 'cf-connecting-ip': '1.2.3.4\r\nX-Injected: 1' }))
      ).toBeNull();
      expect(
        getRateLimitIdentifier(makeRequest({ 'cf-connecting-ip': '1.2.3.4'.padEnd(46, '9') }))
      ).toBeNull();
    });

    it('returns null when no trusted header exists (no shared bucket)', () => {
      expect(getRateLimitIdentifier(makeRequest({}))).toBeNull();
    });
  });

  describe('normalizeClientIp()', () => {
    it('accepts valid IPv4/IPv6 and trims whitespace', () => {
      expect(normalizeClientIp(' 8.8.8.8 ')).toBe('8.8.8.8');
      expect(normalizeClientIp('::1')).toBe('::1');
    });

    it('rejects junk, empty, non-IP and over-long values', () => {
      expect(normalizeClientIp(null)).toBeNull();
      expect(normalizeClientIp(undefined)).toBeNull();
      expect(normalizeClientIp('')).toBeNull();
      expect(normalizeClientIp('localhost')).toBeNull();
      expect(normalizeClientIp('1.2.3.4; DROP TABLE rate_limits')).toBeNull();
      expect(normalizeClientIp('a'.repeat(46))).toBeNull();
    });
  });

  describe('getTrustedClientIp()', () => {
    function makeHeaders(headers: Record<string, string | null>) {
      return { get: (name: string) => headers[name] ?? null };
    }

    it('prefers cf-connecting-ip over x-real-ip and x-vercel-forwarded-for', () => {
      const ip = getTrustedClientIp(
        makeHeaders({
          'cf-connecting-ip': '1.1.1.1',
          'x-real-ip': '2.2.2.2',
          'x-vercel-forwarded-for': '3.3.3.3',
        })
      );
      expect(ip).toBe('1.1.1.1');
    });

    it('skips an invalid higher-priority value and uses the next trusted header', () => {
      const ip = getTrustedClientIp(
        makeHeaders({ 'cf-connecting-ip': 'garbage', 'x-real-ip': '4.4.4.4' })
      );
      expect(ip).toBe('4.4.4.4');
    });
  });

  describe('getRateLimitIdentifierAuthenticated()', () => {
    it('keys the bucket by user ID, not IP', () => {
      expect(getRateLimitIdentifierAuthenticated('u-1')).toBe('user:u-1');
    });
  });

  describe('identifier length / malformed input never reaches the database', () => {
    it('skips the DB round-trip for identifiers longer than varchar(255)', async () => {
      const oversized = 'x'.repeat(MAX_IDENTIFIER_LENGTH + 1);
      await expect(enforceRateLimit('test-route', oversized, 100, 60000)).resolves.toBeUndefined();
      expect(mockReturning).not.toHaveBeenCalled();
    });

    it('skips the DB round-trip for a null identifier (malformed headers)', async () => {
      await expect(enforceRateLimit('test-route', null, 100, 60000)).resolves.toBeUndefined();
      expect(mockReturning).not.toHaveBeenCalled();
    });

    it('still enforces at exactly varchar(255)', async () => {
      mockReturning.mockResolvedValueOnce([{ requestCount: 1 }]);
      await enforceRateLimit('test-route', 'x'.repeat(MAX_IDENTIFIER_LENGTH), 100, 60000);
      expect(mockReturning).toHaveBeenCalledTimes(1);
    });
  });

  describe('getServerActionRateLimitIdentifier()', () => {
    it('uses the trusted client-IP model from next/headers', async () => {
      const { headers } = await import('next/headers');
      (headers as Mock).mockResolvedValueOnce({
        get: (name: string) =>
          name === 'cf-connecting-ip' ? '7.7.7.7' : name === 'x-forwarded-for' ? '8.8.8.8' : null,
      });
      await expect(getServerActionRateLimitIdentifier()).resolves.toBe('7.7.7.7');
    });

    it('returns null when only x-forwarded-for is present (no shared bucket)', async () => {
      const { headers } = await import('next/headers');
      (headers as Mock).mockResolvedValueOnce({
        get: (name: string) => (name === 'x-forwarded-for' ? '9.9.9.9' : null),
      });
      await expect(getServerActionRateLimitIdentifier()).resolves.toBeNull();
    });

    it('returns null when no trusted header is present (no shared bucket)', async () => {
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

  describe('429 response content', () => {
    it('over-limit error carries a generic message with no routeKey/count/limit', async () => {
      mockReturning.mockResolvedValueOnce([{ requestCount: 101 }]);
      const err = await enforceRateLimit('analytics-events', 'user-1', 100, 60000).catch(
        (e: unknown) => e
      );
      expect(err).toBeInstanceOf(RateLimitExceededError);
      const e = err as InstanceType<typeof RateLimitExceededError>;
      expect(e.message).toBe('Too many requests. Please try again later.');
      expect(e.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(e.message).not.toContain('analytics-events');
      expect(e.message).not.toContain('101');
      expect(e.message).not.toContain('100');
      expect(e.routeKey).toBe('analytics-events');
      expect(e.retryAfterSeconds).toBeGreaterThanOrEqual(1);
      expect(e.retryAfterSeconds).toBeLessThanOrEqual(60);
    });

    it('withErrorHandler maps it to 429 with Retry-After and a sanitized body', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { withErrorHandler } = await import('@/lib/api/errorHandler');
        const handler = withErrorHandler(async () => {
          mockReturning.mockResolvedValueOnce([{ requestCount: 101 }]);
          await enforceRateLimit('analytics-events', 'user-1', 100, 60000);
          throw new Error('unreachable');
        });
        const res = await handler(new Request('http://localhost/api/v1/analytics/events'));
        expect(res.status).toBe(429);
        expect(res.headers.get('Retry-After')).toMatch(/^\d+$/);
        expect(Number(res.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);
        const body = JSON.stringify(await res.json());
        expect(body).toContain('Too many requests. Please try again later.');
        expect(body).not.toContain('analytics-events');
        expect(body).not.toContain('101');
        expect(body).not.toContain('100');
        expect(body).not.toContain('"limit"');
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});
