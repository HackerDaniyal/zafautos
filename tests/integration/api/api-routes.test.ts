import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../../src');
const routePath = path.join(SRC, 'app/api/search/suggestions/route.ts');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(SRC, relPath), 'utf-8');
}

describe('API Routes - Search Suggestions', () => {
  let source: string;

  it('route file exists at src/app/api/search/suggestions/route.ts', () => {
    expect(fs.existsSync(routePath)).toBe(true);
    source = fs.readFileSync(routePath, 'utf-8');
  });

  it('exports a GET handler', () => {
    const content = source ?? fs.readFileSync(routePath, 'utf-8');
    expect(content).toMatch(/export\s+async\s+function\s+GET/);
  });

  it('filters vehicles by active status', () => {
    const content = source ?? fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("eq(vehicles.status, 'active')");
  });

  it('excludes deleted vehicles using deletedAt IS NULL', () => {
    const content = source ?? fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('isNull(vehicles.deletedAt)');
  });

  it('excludes deleted manufacturers', () => {
    const content = source ?? fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('isNull(manufacturers.deletedAt)');
  });

  it('excludes deleted models', () => {
    const content = source ?? fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('isNull(models.deletedAt)');
  });

  it('returns empty suggestions for queries shorter than 2 characters', () => {
    const content = source ?? fs.readFileSync(routePath, 'utf-8');
    expect(content).toMatch(/q\.length\s*<\s*2/);
    expect(content).toContain('{ suggestions: [] }');
  });

  it('trims the query parameter', () => {
    const content = source ?? fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('.trim()');
  });

  it('does not expose service-role credentials', () => {
    const content = source ?? fs.readFileSync(routePath, 'utf-8');
    expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(content).not.toContain('service_role');
  });

  it('handles errors gracefully without leaking internals', () => {
    const content = source ?? fs.readFileSync(routePath, 'utf-8');
    expect(content).toMatch(/catch/);
    expect(content).toContain('{ suggestions: [] }');
  });

  it('limits results with MAX_SUGGESTIONS', () => {
    const content = source ?? fs.readFileSync(routePath, 'utf-8');
    expect(content).toMatch(/MAX_SUGGESTIONS/);
  });
});
