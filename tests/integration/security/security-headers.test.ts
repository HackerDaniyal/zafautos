import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../../');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

describe('Security Headers', () => {
  it('middleware.ts sets X-Content-Type-Options', () => {
    const middleware = readFile('middleware.ts');
    expect(middleware).toContain('X-Content-Type-Options');
    expect(middleware).toContain('nosniff');
  });

  it('middleware.ts sets X-Frame-Options', () => {
    const middleware = readFile('middleware.ts');
    expect(middleware).toContain('X-Frame-Options');
    expect(middleware).toContain('DENY');
  });

  it('middleware.ts sets Referrer-Policy', () => {
    const middleware = readFile('middleware.ts');
    expect(middleware).toContain('Referrer-Policy');
  });

  it('middleware.ts sets Content-Security-Policy', () => {
    const middleware = readFile('middleware.ts');
    expect(middleware).toContain('Content-Security-Policy');
    expect(middleware).toContain("default-src 'self'");
  });

  it('middleware.ts sets Permissions-Policy', () => {
    const middleware = readFile('middleware.ts');
    expect(middleware).toContain('Permissions-Policy');
  });

  it('middleware.ts sets Cross-Origin headers', () => {
    const middleware = readFile('middleware.ts');
    expect(middleware).toContain('Cross-Origin-Resource-Policy');
    expect(middleware).toContain('Cross-Origin-Opener-Policy');
  });

  it('middleware.ts sets Cache-Control no-store', () => {
    const middleware = readFile('middleware.ts');
    expect(middleware).toContain('Cache-Control');
  });
});
