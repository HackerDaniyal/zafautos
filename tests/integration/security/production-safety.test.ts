import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../../');
const SRC = path.join(ROOT, 'src');

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

function findFilesRecursive(dir: string, extension: string): string[] {
  const results: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !['node_modules', '.next', 'dist'].includes(item.name)) {
      results.push(...findFilesRecursive(fullPath, extension));
    } else if (item.isFile() && item.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Production Safety - .env.example', () => {
  it('.env.example has placeholder values, not real secrets', () => {
    const content = readFile(path.join(ROOT, '.env.example'));
    expect(content).toContain('your-project.supabase.co');
    expect(content).toContain('your-anon-key');
    expect(content).toContain('your-service-role-key');
  });

  it('.env.example does not contain real Supabase URLs', () => {
    const content = readFile(path.join(ROOT, '.env.example'));
    expect(content).not.toMatch(/https:\/\/[a-z0-9]{20,}\.supabase\.co/);
  });

  it('.env.example does not contain real API keys', () => {
    const content = readFile(path.join(ROOT, '.env.example'));
    expect(content).not.toMatch(/eyJ[A-Za-z0-9_-]{50,}/);
  });
});

describe('Production Safety - AUTH_BYPASS Gating', () => {
  it('session.ts gates AUTH_BYPASS behind NODE_ENV=development', () => {
    const content = readFile(path.join(SRC, 'lib/auth/session.ts'));
    expect(content).toContain("process.env.AUTH_BYPASS === 'true'");
    expect(content).toContain("process.env.NODE_ENV === 'development'");
  });

  it('middleware.ts gates AUTH_BYPASS behind NODE_ENV=development', () => {
    const content = readFile(path.join(SRC, 'lib/supabase/middleware.ts'));
    expect(content).toContain("process.env.AUTH_BYPASS === 'true'");
    expect(content).toContain("process.env.NODE_ENV === 'development'");
  });

  it('AUTH_BYPASS check uses AND (both conditions required)', () => {
    const sessionContent = readFile(path.join(SRC, 'lib/auth/session.ts'));
    const bypassLines = sessionContent
      .split('\n')
      .filter((line) => line.includes('AUTH_BYPASS') && !line.trim().startsWith('//'));
    const hasAnd = bypassLines.some((line) => line.includes('&&'));
    expect(hasAnd).toBe(true);
  });
});

describe('Production Safety - No console.log in Production Code', () => {
  it('social-login-buttons.tsx has no console.log', () => {
    const content = readFile(path.join(SRC, 'components/auth/social-login-buttons.tsx'));
    expect(content).not.toContain('console.log');
  });

  it('search suggestions route has no console.log', () => {
    const content = readFile(path.join(SRC, 'app/api/search/suggestions/route.ts'));
    expect(content).not.toContain('console.log');
  });

  it('homepage-data.ts has no console.log', () => {
    const content = readFile(path.join(SRC, 'lib/homepage-data.ts'));
    expect(content).not.toContain('console.log');
  });

  it('error handler has no console.log', () => {
    const content = readFile(path.join(SRC, 'lib/errors/action-error.ts'));
    expect(content).not.toContain('console.log');
  });

  it('audit service has no console.log', () => {
    const content = readFile(path.join(SRC, 'server/services/auditService.ts'));
    expect(content).not.toContain('console.log');
  });
});

describe('Production Safety - No Hardcoded Secrets', () => {
  it('no hardcoded API keys in source files', () => {
    const tsFiles = findFilesRecursive(SRC, '.ts');
    const tsxFiles = findFilesRecursive(SRC, '.tsx');
    const allFiles = [...tsFiles, ...tsxFiles];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/eyJ[A-Za-z0-9_-]{50,}/);
      expect(content).not.toContain('sk_live_');
      expect(content).not.toContain('pk_live_');
    }
  });

  it('no hardcoded database connection strings in source', () => {
    const tsFiles = findFilesRecursive(SRC, '.ts');
    const tsxFiles = findFilesRecursive(SRC, '.tsx');
    const allFiles = [...tsFiles, ...tsxFiles];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/postgresql:\/\/[^@]+@[^/]+/);
    }
  });

  it('no hardcoded passwords in source', () => {
    const tsFiles = findFilesRecursive(SRC, '.ts');
    const tsxFiles = findFilesRecursive(SRC, '.tsx');
    const allFiles = [...tsFiles, ...tsxFiles];

    const passwordPatterns = [
      /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /secret\s*[:=]\s*['"][^'"]{8,}['"]/i,
    ];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of passwordPatterns) {
        expect(content).not.toMatch(pattern);
      }
    }
  });
});

describe('Production Safety - Service-Role Key Location', () => {
  it('service-role key is only referenced in server-side code', () => {
    const tsFiles = findFilesRecursive(SRC, '.ts');
    const tsxFiles = findFilesRecursive(SRC, '.tsx');
    const allFiles = [...tsFiles, ...tsxFiles];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        const normalized = file.replace(/\\/g, '/');
        const isServerSide =
          normalized.includes('/server/') ||
          normalized.includes('/lib/supabase/') ||
          normalized.includes('/lib/env');
        expect(isServerSide).toBe(true);
      }
    }
  });

  it('service-role key is not in client components', () => {
    const clientComponents = findFilesRecursive(path.join(SRC, 'components'), '.tsx');
    for (const file of clientComponents) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    }
  });

  it('service-role key is not in app router pages (client)', () => {
    const appPages = findFilesRecursive(path.join(SRC, 'app'), '.tsx');
    for (const file of appPages) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    }
  });
});
