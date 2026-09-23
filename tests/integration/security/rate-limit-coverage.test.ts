import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../../src');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC, relPath), 'utf-8');
}

function walkRouteFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkRouteFiles(full, acc);
    } else if (entry.name === 'route.ts') {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Phase 7 endpoint classification — every API route must appear in exactly one
 * map. COVERED routes enforce a rate limit; SKIPPED routes are intentionally
 * unprotected with a documented materiality rationale. Adding a new route
 * without classifying it fails `classification covers every route file`.
 */
const COVERED: Record<string, string[]> = {
  'app/api/v1/public/track/route.ts': ['public-track'],
  'app/api/v1/analytics/events/route.ts': ['analytics-events'],
  'app/api/v1/analytics/search/route.ts': ['analytics-search'],
  'app/api/v1/analytics/views/route.ts': ['analytics-views'],
  'app/api/v1/marketplace/enquiries/route.ts': ['marketplace-enquiries'],
  'app/api/search/suggestions/route.ts': ['search-suggestions'],
  'app/api/v1/payments/route.ts': ['payments-create'],
  'app/api/v1/payments/invoices/route.ts': ['payments-create'],
  'app/api/v1/payments/orders/[orderId]/route.ts': ['payments-create'],
  'app/api/v1/payments/users/[userId]/route.ts': ['payments-create'],
  'app/api/v1/payments/[id]/status/route.ts': ['payments-create'],
  'app/api/v1/orders/route.ts': ['orders-create'],
  'app/api/v1/documents/route.ts': ['documents-create'],
  'app/api/v1/vehicles/route.ts': ['vehicles-create'],
};

const SKIPPED: Record<string, string> = {
  'app/api/v1/vehicles/[id]/route.ts': 'unimplemented 501 stub — nothing to protect',
  'app/api/v1/shipping/ports/route.ts': 'public static reference read (cheap single query)',
  'app/api/v1/marketplace/featured/route.ts': 'public cheap read, no write amplification',
  'app/api/v1/marketplace/wishlist/route.ts': 'authenticated session-bound cheap CRUD',
  'app/api/v1/marketplace/compare/route.ts': 'authenticated cheap insert',
  'app/api/v1/marketplace/views/route.ts': 'authenticated cheap insert',
  'app/api/v1/auth/permissions/route.ts': 'authenticated RBAC read',
  'app/api/v1/customers/profile/route.ts': 'authenticated self read',
  'app/api/v1/customers/settings/route.ts': 'authenticated self-service write',
  'app/api/v1/customers/addresses/route.ts': 'authenticated self-service CRUD',
  'app/api/v1/customers/alerts/route.ts': 'authenticated cheap insert',
  'app/api/v1/dealers/profile/route.ts': 'authenticated read',
  'app/api/v1/dealers/activity/route.ts': 'role-gated cheap log insert',
  'app/api/v1/dealers/assignments/route.ts': 'role-gated staff read/write (RBAC sufficient)',
  'app/api/v1/documents/[id]/versions/route.ts': 'authenticated read',
  'app/api/v1/documents/vehicles/[vehicleId]/route.ts': 'authenticated read',
  'app/api/v1/orders/[id]/route.ts': 'permission-gated order detail mutations (collection create is limited)',
  'app/api/v1/orders/[id]/items/route.ts': 'permission-gated order item mutations (RBAC sufficient)',
  'app/api/v1/orders/[id]/status/route.ts': 'permission-gated status transitions (RBAC sufficient)',
  'app/api/v1/shipping/route.ts': 'permission-gated staff creation (RBAC sufficient)',
  'app/api/v1/shipping/[id]/containers/route.ts': 'permission-gated staff mutation (RBAC sufficient)',
  'app/api/v1/shipping/[id]/tracking/route.ts': 'permission-gated staff mutation (RBAC sufficient)',
  'app/api/v1/shipping/orders/[orderId]/route.ts': 'permission-gated staff mutation (RBAC sufficient)',
};

/** Routes that identify by authenticated user ID instead of client IP. */
const USER_IDENTITY_ROUTES = [
  'app/api/v1/payments/route.ts',
  'app/api/v1/payments/invoices/route.ts',
  'app/api/v1/payments/orders/[orderId]/route.ts',
  'app/api/v1/payments/users/[userId]/route.ts',
  'app/api/v1/payments/[id]/status/route.ts',
  'app/api/v1/orders/route.ts',
  'app/api/v1/documents/route.ts',
  'app/api/v1/vehicles/route.ts',
];

describe('Phase 7 — rate-limit coverage classification', () => {
  const routeFiles = walkRouteFiles(path.join(SRC, 'app/api')).map((f) =>
    path.relative(SRC, f).split(path.sep).join('/')
  );

  it('classification covers every route file (no unclassified routes)', () => {
    const classified = [...Object.keys(COVERED), ...Object.keys(SKIPPED)].sort();
    expect([...routeFiles].sort()).toEqual(classified);
  });

  it('every skipped route has a documented materiality rationale', () => {
    for (const [file, reason] of Object.entries(SKIPPED)) {
      expect(reason, file).toBeTruthy();
      expect(reason.length, file).toBeGreaterThan(10);
    }
  });

  it('every covered route calls enforceRateLimit with its expected route key', () => {
    for (const [file, keys] of Object.entries(COVERED)) {
      const source = readSrc(file);
      expect(source, file).toContain('enforceRateLimit');
      for (const key of keys) {
        expect(source, `${file} → ${key}`).toContain(`'${key}'`);
      }
    }
  });

  it('authenticated covered routes use the user-ID identifier, never raw x-forwarded-for', () => {
    for (const file of USER_IDENTITY_ROUTES) {
      const source = readSrc(file);
      expect(source, file).toContain('getRateLimitIdentifierAuthenticated');
      expect(source, file).not.toContain('getRateLimitIdentifier(');
    }
  });

  it('rate limiting runs BEFORE request body parsing on write endpoints', () => {
    const bodyParsingRoutes = [
      'app/api/v1/public/track/route.ts',
      'app/api/v1/analytics/events/route.ts',
      'app/api/v1/analytics/search/route.ts',
      'app/api/v1/analytics/views/route.ts',
      'app/api/v1/marketplace/enquiries/route.ts',
      'app/api/v1/payments/route.ts',
      'app/api/v1/payments/invoices/route.ts',
      'app/api/v1/payments/orders/[orderId]/route.ts',
      'app/api/v1/payments/users/[userId]/route.ts',
      'app/api/v1/payments/[id]/status/route.ts',
      'app/api/v1/orders/route.ts',
      'app/api/v1/documents/route.ts',
      'app/api/v1/vehicles/route.ts',
    ];
    for (const file of bodyParsingRoutes) {
      const source = readSrc(file);
      const enforceAt = source.indexOf('await enforceRateLimit');
      const parseAt = source.indexOf('await req.json()');
      expect(enforceAt, file).toBeGreaterThanOrEqual(0);
      expect(parseAt, file).toBeGreaterThan(enforceAt);
    }
  });

  it('withAuth maps RATE_LIMIT_EXCEEDED to HTTP 429 with a generic message', () => {
    const apiAuth = readSrc('lib/api/apiAuth.ts');
    expect(apiAuth).toContain('RATE_LIMIT_EXCEEDED');
    expect(apiAuth).toContain('429');
    expect(apiAuth).toContain('Too many requests');
  });
});

describe('Phase 7 — rateLimiter core preservation (Phase 4 invariants)', () => {
  const source = () => readSrc('lib/api/rateLimiter.ts');

  it('keeps the PostgreSQL atomic upsert implementation', () => {
    expect(source()).toContain('.insert(');
    expect(source()).toContain('.onConflictDoUpdate(');
    expect(source()).toContain('.returning(');
  });

  it('keeps fail-open behavior and both identifier helpers', () => {
    expect(source()).toContain('Fail-open');
    expect(source()).toContain('getRateLimitIdentifier');
    expect(source()).toContain('getRateLimitIdentifierAuthenticated');
    expect(source()).not.toContain('return Promise.resolve()');
  });

  it('adds server-action identifier via next/headers with null-skip semantics', () => {
    expect(source()).toContain('getServerActionRateLimitIdentifier');
    expect(source()).toContain("import('next/headers')");
    expect(source()).toContain('Promise<string | null>');
  });

  it('adds stale-row cleanup with retention buffer, batching, and probability', () => {
    expect(source()).toContain('cleanupExpiredRateLimits');
    expect(source()).toContain('RATE_LIMIT_RETENTION_MS');
    expect(source()).toContain('RATE_LIMIT_CLEANUP_BATCH_SIZE');
    expect(source()).toContain('RATE_LIMIT_CLEANUP_PROBABILITY');
    expect(source()).toContain('expires_at <=');
    expect(source()).toContain('enforceFileUploadRateLimit');
    expect(source()).toContain("'file-uploads'");
  });

  it('cleanup cannot race active windows: retention uses expiry + buffer', () => {
    expect(source()).toContain('RATE_LIMIT_RETENTION_MS = 60 * 60 * 1000');
  });

  it('migration 0012 adds the expires_at index used by cleanup', () => {
    const migration = fs.readFileSync(
      path.join(SRC, 'server/db/migrations/0012_phase7_rate_limits_retention.sql'),
      'utf-8'
    );
    expect(migration).toContain('CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx');
    expect(migration).toContain('rate_limits');
    expect(migration).toContain('expires_at');
  });
});

describe('Phase 7 — authentication server-action coverage', () => {
  const source = () => readSrc('server/actions/authActions.ts');

  it('limits login by IP and by target email (dual key)', () => {
    expect(source()).toContain("'auth-login-ip'");
    expect(source()).toContain("'auth-login-email'");
    expect(source()).toContain('getServerActionRateLimitIdentifier');
  });

  it('limits registration, password-reset request, resend verification, and password change', () => {
    expect(source()).toContain("'auth-register'");
    expect(source()).toContain("'auth-forgot-password'");
    expect(source()).toContain("'auth-resend-verification'");
    expect(source()).toContain("'auth-change-password'");
  });

  it('returns a friendly RATE_LIMIT_EXCEEDED ActionResult instead of raw counts', () => {
    expect(source()).toContain('RateLimitExceededError');
    expect(source()).toContain('Too many attempts. Please try again later.');
  });

  it('does not rate-limit logout or link-based password reset (recovery session required)', () => {
    expect(source()).not.toContain("'auth-logout'");
    expect(source()).not.toContain("'auth-reset-password'");
  });
});

describe('Phase 7 — public conversion/tracking server-action coverage', () => {
  const source = () => readSrc('server/actions/publicConversionActions.ts');

  it('limits the public vehicle enquiry write path', () => {
    expect(source()).toContain("'vehicle-enquiries'");
  });

  it('limits public tracking writes and degrades silently over the limit', () => {
    expect(source()).toContain("'vehicle-views'");
    expect(source()).toContain("'whatsapp-clicks'");
  });

  it('limits the public compare search endpoint', () => {
    expect(source()).toContain("'compare-search'");
  });

  it('prefers user-ID identity for logged-in callers, IP otherwise', () => {
    expect(source()).toContain('getRateLimitIdentifierAuthenticated');
    expect(source()).toContain('getServerActionRateLimitIdentifier');
  });
});

describe('Phase 7 — file-upload server-action coverage', () => {
  it('all six upload entrypoints enforce the shared file-uploads limit', () => {
    const uploadFiles: Array<[string, number]> = [
      ['server/actions/documentUpload.ts', 1],
      ['server/actions/documentActions.ts', 1],
      ['server/actions/mediaActions.ts', 2],
      ['server/actions/vehicleActions.ts', 2],
    ];
    let total = 0;
    for (const [file, expected] of uploadFiles) {
      const source = readSrc(file);
      const count = (source.match(/enforceFileUploadRateLimit\(/g) ?? []).length;
      expect(count, file).toBe(expected);
      total += count;
    }
    expect(total).toBe(6);
  });

  it('upload limits are enforced after auth + permission checks, before file work', () => {
    for (const file of [
      'server/actions/documentUpload.ts',
      'server/actions/documentActions.ts',
      'server/actions/mediaActions.ts',
      'server/actions/vehicleActions.ts',
    ]) {
      const source = readSrc(file);
      const permAt = source.indexOf('requirePermission');
      const limitAt = source.indexOf('await enforceFileUploadRateLimit');
      expect(limitAt, file).toBeGreaterThan(permAt);
    }
  });
});
