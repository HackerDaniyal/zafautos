import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../../src');

function readRoute(relPath: string): string {
  return fs.readFileSync(path.join(SRC, relPath), 'utf-8');
}

describe('Rate Limiting — API Routes', () => {
  it('analytics/events/route.ts calls enforceRateLimit with request identifier', () => {
    const route = readRoute('app/api/v1/analytics/events/route.ts');
    expect(route).toContain('enforceRateLimit');
    expect(route).toContain('getRateLimitIdentifier');
    expect(route).toContain("'analytics-events'");
  });

  it('analytics/search/route.ts calls enforceRateLimit with request identifier', () => {
    const route = readRoute('app/api/v1/analytics/search/route.ts');
    expect(route).toContain('enforceRateLimit');
    expect(route).toContain('getRateLimitIdentifier');
    expect(route).toContain("'analytics-search'");
  });

  it('analytics/views/route.ts calls enforceRateLimit', () => {
    const route = readRoute('app/api/v1/analytics/views/route.ts');
    expect(route).toContain('enforceRateLimit');
    expect(route).toContain('getRateLimitIdentifier');
  });

  it('public/track/route.ts uses shared enforceRateLimit, not in-memory Map', () => {
    const route = readRoute('app/api/v1/public/track/route.ts');
    expect(route).toContain('enforceRateLimit');
    expect(route).not.toContain('rateLimitMap');
    expect(route).not.toContain('checkRateLimit');
  });

  it('rateLimiter.ts no longer contains no-op implementation', () => {
    const rateLimiter = readRoute('lib/api/rateLimiter.ts');
    expect(rateLimiter).not.toContain('return Promise.resolve()');
    expect(rateLimiter).not.toContain('void identifier');
    expect(rateLimiter).not.toContain('// Pass-through');
  });

  it('rateLimiter.ts has database-backed enforcement', () => {
    const rateLimiter = readRoute('lib/api/rateLimiter.ts');
    expect(rateLimiter).toContain('db');
    expect(rateLimiter).toContain('.insert(');
    expect(rateLimiter).toContain('.onConflictDoUpdate(');
    expect(rateLimiter).toContain('.returning(');
  });

  it('rateLimiter.ts implements fail-open behavior', () => {
    const rateLimiter = readRoute('lib/api/rateLimiter.ts');
    expect(rateLimiter).toContain('Fail-open');
  });

  it('rateLimiter.ts exports getRateLimitIdentifierAuthenticated', () => {
    const rateLimiter = readRoute('lib/api/rateLimiter.ts');
    expect(rateLimiter).toContain('getRateLimitIdentifierAuthenticated');
  });
});
