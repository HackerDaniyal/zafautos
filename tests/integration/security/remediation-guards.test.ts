import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../../');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

/**
 * Source-level regression tests for Phase 10A remediation (C3–C9, H1–H6).
 * These assert the security fixes are present without needing a live DB.
 */
describe('Remediation source guards', () => {
  describe('C3/C4 — open redirect', () => {
    it('login form validates redirect via safeInternalPath', () => {
      const src = readFile('src/components/auth/login-form.tsx');
      expect(src).toContain('safeInternalPath');
      expect(src).not.toMatch(/router\.push\(\s*searchParams\.get\(/);
    });

    it('auth callback validates next via safeInternalPath', () => {
      const src = readFile('src/app/auth/callback/route.ts');
      expect(src).toContain('safeInternalPath');
      expect(src).toMatch(/const next = safeInternalPath\(/);
    });
  });

  describe('C5 — message thread participant authorization', () => {
    it('thread list filters by participant', () => {
      const src = readFile('src/server/actions/accountActions.ts');
      expect(src).toMatch(/isParticipant|exists\(/);
      expect(src).toMatch(/eq\(messages\.senderId, auth\.userId\)/);
      expect(src).toMatch(/eq\(messages\.recipientId, auth\.userId\)/);
    });

    it('thread detail and send check participant', () => {
      const src = readFile('src/server/actions/accountActions.ts');
      expect(src).toContain('Access denied to this thread');
      expect(src).toMatch(/getMyThreadDetail[\s\S]*participant/);
    });
  });

  describe('C6 — getProfileByUserId authorization', () => {
    it('requires auth and self-or-admin', () => {
      const src = readFile('src/server/actions/authActions.ts');
      expect(src).toMatch(/getProfileByUserId[\s\S]*requireAuth\(\)/);
      expect(src).toMatch(/getProfileByUserId[\s\S]*hasMinRole\(auth, 'admin'\)/);
    });
  });

  describe('C7 — public track route', () => {
    it('email fallback only when order has no customerId', () => {
      const src = readFile('src/app/api/v1/public/track/route.ts');
      expect(src).toMatch(/if \(!order\.customerId\) \{[\s\S]*userMatch/);
      // Must not fall through to "any user email" when customerId exists
      expect(src).not.toMatch(/if \(!emailVerified\) \{\s*const \[userMatch\]/);
    });

    it('scopes tracking events to shipment ids', () => {
      const src = readFile('src/app/api/v1/public/track/route.ts');
      expect(src).toContain('inArray(shipmentTracking.shipmentId, ids)');
    });
  });

  describe('C8 — Supabase session cookies', () => {
    it('server client sets httpOnly cookieOptions', () => {
      const src = readFile('src/lib/supabase/server.ts');
      expect(src).toContain('cookieOptions');
      expect(src).toContain('httpOnly: true');
    });

    it('middleware client sets httpOnly cookieOptions', () => {
      const src = readFile('src/lib/supabase/middleware.ts');
      expect(src).toContain('cookieOptions');
      expect(src).toContain('httpOnly: true');
    });
  });

  describe('C9 — customer/dealer ownership gates', () => {
    it('customers profile requires self or admin', () => {
      const src = readFile('src/app/api/v1/customers/profile/route.ts');
      expect(src).toContain("hasMinRole(auth, 'admin')");
      expect(src).not.toMatch(/auth\.role === 'customer' && auth\.userId !== userId/);
    });

    it('customers settings/addresses/alerts deny non-admin non-customer', () => {
      for (const rel of [
        'src/app/api/v1/customers/settings/route.ts',
        'src/app/api/v1/customers/addresses/route.ts',
        'src/app/api/v1/customers/alerts/route.ts',
      ]) {
        const src = readFile(rel);
        expect(src).toContain("hasMinRole(auth, 'admin')");
      }
    });

    it('dealers profile/assignments deny non-admin non-dealer', () => {
      for (const rel of [
        'src/app/api/v1/dealers/profile/route.ts',
        'src/app/api/v1/dealers/assignments/route.ts',
      ]) {
        const src = readFile(rel);
        expect(src).toContain("hasMinRole(auth, 'admin')");
      }
    });
  });

  describe('H1 — withAuth separates auth and handler errors', () => {
    it('handler errors go through handlerErrorResponse, not raw auth path', () => {
      const src = readFile('src/lib/api/apiAuth.ts');
      expect(src).toContain('handlerErrorResponse');
      expect(src).toMatch(/return await handler\(req, auth, context\);\s*\} catch \(error\) \{\s*return handlerErrorResponse\(error\);/);
      expect(src).toContain('INTERNAL_ERROR');
      // Non-domain errors must not echo raw messages
      expect(src).toMatch(/Non-domain handler failures must not leak internals/);
    });
  });

  describe('H2 — action-error production gate', () => {
    it('generic Error messages gated on NODE_ENV=development', () => {
      const src = readFile('src/lib/errors/action-error.ts');
      expect(src).toContain("process.env.NODE_ENV === 'development'");
      expect(src).toContain("'An unexpected error occurred'");
    });
  });

  describe('H3 — registration non-enumeration', () => {
    it('existing email returns same success as new registration', () => {
      const src = readFile('src/server/actions/authActions.ts');
      const registerFn = src.slice(
        src.indexOf('export async function register'),
        src.indexOf('export async function logout'),
      );
      expect(registerFn).toMatch(/existingUser[\s\S]*return \{ success: true, data: undefined \}/);
      expect(registerFn).not.toContain('USER_ALREADY_EXISTS');
    });

    it('signUp provider errors are not echoed raw in register()', () => {
      const src = readFile('src/server/actions/authActions.ts');
      const registerFn = src.slice(
        src.indexOf('export async function register'),
        src.indexOf('export async function logout'),
      );
      expect(registerFn).not.toContain('authError.message');
      expect(registerFn).toContain('Registration failed. Please try again.');
      expect(registerFn).not.toContain('USER_ALREADY_EXISTS');
    });
  });

  describe('H4 — published-only public blog posts', () => {
    it('repository supports publishedOnly filter', () => {
      const src = readFile('src/server/repositories/newCmsRepository.ts');
      expect(src).toMatch(/findBlogPostBySlug[\s\S]*publishedOnly/);
      expect(src).toContain("eq(blogPosts.status, 'published')");
    });

    it('public page and action use published-only lookup', () => {
      const page = readFile('src/app/(public)/blog/[slug]/page.tsx');
      expect(page).toContain('getPublishedBlogPostBySlug');
      const actions = readFile('src/server/actions/cmsActions.ts');
      expect(actions).toContain('getPublishedBlogPostBySlug');
    });

    it('admin slug uniqueness checks still use unfiltered lookup', () => {
      const service = readFile('src/server/services/cmsService.ts');
      // createBlogPost / updateBlogPost call findBlogPostBySlug without publishedOnly
      expect(service).toMatch(/existing = await newCmsRepository\.findBlogPostBySlug\(slug\)/);
    });
  });

  describe('H5 — public vehicle compare data filtered', () => {
    it('getVehiclesByIds filters active + not deleted', () => {
      const src = readFile('src/server/actions/publicConversionActions.ts');
      expect(src).toMatch(/getVehiclesByIds[\s\S]*eq\(vehicles\.status, 'active'\)/);
      expect(src).toMatch(/getVehiclesByIds[\s\S]*isNull\(vehicles\.deletedAt\)/);
    });
  });

  describe('H6 — vehicles API permission gate', () => {
    it('non-active status requires vehicles.read for staff', () => {
      const src = readFile('src/app/api/v1/vehicles/route.ts');
      expect(src).toContain("requirePermission(auth, 'vehicles.read')");
      expect(src).toMatch(/auth\.role === 'customer'/);
    });
  });

  describe('C10 — COEP removed', () => {
    it('middleware does not set COEP require-corp', () => {
      const src = readFile('src/middleware.ts');
      expect(src).not.toContain("Cross-Origin-Embedder-Policy', 'require-corp'");
      expect(src).toContain('Cross-Origin-Opener-Policy');
    });
  });

  describe('C1/C2 — access model migration present', () => {
    it('0013 revokes anon/authenticated and enables RLS', () => {
      const src = readFile('src/server/db/migrations/0013_phase10a_access_model.sql');
      expect(src).toContain('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated');
      expect(src).toContain('ENABLE ROW LEVEL SECURITY');
      expect(src).toContain('CREATE TABLE IF NOT EXISTS rate_limits');
      expect(src).toContain('rate_limits_expires_at_idx');
      expect(src).toContain('ALTER DEFAULT PRIVILEGES');
    });
  });
});
