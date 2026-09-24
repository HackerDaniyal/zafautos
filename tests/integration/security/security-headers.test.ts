import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../../');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

describe('Security Headers', () => {
  it('middleware.ts sets X-Content-Type-Options', () => {
    const middleware = readFile('src/middleware.ts');
    expect(middleware).toContain('X-Content-Type-Options');
    expect(middleware).toContain('nosniff');
  });

  it('middleware.ts sets X-Frame-Options', () => {
    const middleware = readFile('src/middleware.ts');
    expect(middleware).toContain('X-Frame-Options');
    expect(middleware).toContain('DENY');
  });

  it('middleware.ts sets Referrer-Policy', () => {
    const middleware = readFile('src/middleware.ts');
    expect(middleware).toContain('Referrer-Policy');
  });

  it('middleware.ts sets Content-Security-Policy', () => {
    const middleware = readFile('src/middleware.ts');
    expect(middleware).toContain('Content-Security-Policy');
    expect(middleware).toContain("default-src 'self'");
  });

  it('middleware.ts sets Permissions-Policy', () => {
    const middleware = readFile('src/middleware.ts');
    expect(middleware).toContain('Permissions-Policy');
  });

  it('middleware.ts sets Cross-Origin headers', () => {
    const middleware = readFile('src/middleware.ts');
    expect(middleware).toContain('Cross-Origin-Resource-Policy');
    expect(middleware).toContain('Cross-Origin-Opener-Policy');
  });

  it('middleware.ts does NOT set Cross-Origin-Embedder-Policy (C10)', () => {
    const middleware = readFile('src/middleware.ts');
    // COEP require-corp blocks Supabase storage images (CORP: null).
    expect(middleware).not.toMatch(/headers\.set\(\s*['"]Cross-Origin-Embedder-Policy['"]/);
    expect(middleware).not.toContain("Cross-Origin-Embedder-Policy', 'require-corp'");
  });

  it('middleware.ts sets Cache-Control no-store', () => {
    const middleware = readFile('src/middleware.ts');
    expect(middleware).toContain('Cache-Control');
  });
});

// ---------------------------------------------------------------------------
// Phase 8 — Content-Security-Policy hardening
// ---------------------------------------------------------------------------

function extractDirective(middleware: string, directive: string): string {
  const lines = middleware.split('\n');
  const line = lines.find((l) => l.includes(directive));
  return line ?? '';
}

describe('CSP (Phase 8) — middleware.ts', () => {
  const middleware = readFile('src/middleware.ts');

  it('generates a per-request nonce', () => {
    expect(middleware).toMatch(/crypto\.randomUUID\(\)/);
    expect(middleware).toMatch(/btoa\(/);
  });

  it('forwards the CSP on REQUEST headers so app-render stamps the nonce on scripts', () => {
    expect(middleware).toMatch(/requestHeaders\.set\(\s*['"]Content-Security-Policy['"]/);
    expect(middleware).toMatch(/new NextRequest\(\s*request\s*,\s*\{\s*headers:\s*requestHeaders\s*\}/);
    expect(middleware).toMatch(/updateSession\(\s*nextRequest\s*\)/);
  });

  it('sets the same CSP on RESPONSE headers for browser enforcement', () => {
    expect(middleware).toMatch(/response\.headers\.set\(\s*['"]Content-Security-Policy['"]\s*,\s*csp\s*\)/);
  });

  it("script-src uses nonce + strict-dynamic and NOT unsafe-inline", () => {
    const scriptSrc = extractDirective(middleware, "script-src 'self'");
    expect(scriptSrc).toContain("'nonce-${nonce}'");
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(middleware).toContain("script-src-attr 'none'");
  });

  it("style-src keeps 'unsafe-inline' for React style attributes (documented)", () => {
    expect(middleware).toContain("style-src 'self' 'unsafe-inline'");
    expect(middleware).toMatch(/style-src keeps 'unsafe-inline'/);
  });

  it('img-src allows self, blob: (upload previews), and the Supabase origin', () => {
    const imgSrc = extractDirective(middleware, 'img-src ');
    expect(imgSrc).toContain("'self'");
    expect(imgSrc).toContain('blob:');
    expect(imgSrc).toContain('supabaseOrigin');
    expect(imgSrc).not.toContain('data:');
  });

  it('font-src stays self-only (next/font self-hosts fonts)', () => {
    expect(middleware).toContain("font-src 'self'");
  });

  it('connect-src allows self + env-derived Supabase origin', () => {
    const connectSrc = extractDirective(middleware, 'connect-src ');
    expect(connectSrc).toContain("'self'");
    expect(connectSrc).toContain('supabaseOrigin');
    expect(middleware).toContain('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('denies framing via frame-ancestors and frame-src', () => {
    expect(middleware).toContain("frame-ancestors 'none'");
    expect(middleware).toContain("frame-src 'none'");
  });

  it('keeps object-src none, base-uri self, form-action self', () => {
    expect(middleware).toContain("object-src 'none'");
    expect(middleware).toContain("base-uri 'self'");
    expect(middleware).toContain("form-action 'self'");
  });

  it('default-src remains self-only', () => {
    expect(middleware).toContain("default-src 'self'");
  });

  it('mutates the updateSession response in place (preserves Set-Cookie)', () => {
    expect(middleware).not.toMatch(/new NextResponse\(\s*response\.body/);
    expect(middleware).toMatch(/response\.headers\.set\(/);
  });

  it('middleware matcher still excludes static assets and the image optimizer', () => {
    expect(middleware).toContain('_next/static');
    expect(middleware).toContain('_next/image');
  });

  it('root layout forces dynamic rendering so per-request nonces reach every page', () => {
    const layout = readFile('src/app/layout.tsx');
    expect(layout).toContain("export const dynamic = 'force-dynamic'");
    expect(layout).toMatch(/nonce/i);
  });
});
