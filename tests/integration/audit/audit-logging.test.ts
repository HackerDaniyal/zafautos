import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../../src');
const auditServicePath = path.join(SRC, 'server/services/auditService.ts');

function readService(): string {
  return fs.readFileSync(auditServicePath, 'utf-8');
}

describe('Audit Service - Structure', () => {
  it('auditService.ts exists at src/server/services/auditService.ts', () => {
    expect(fs.existsSync(auditServicePath)).toBe(true);
  });

  it('exports an AuditService class', () => {
    const content = readService();
    expect(content).toMatch(/export\s+class\s+AuditService/);
  });

  it('exports a singleton auditService instance', () => {
    const content = readService();
    expect(content).toMatch(/export\s+const\s+auditService\s*=\s*new\s+AuditService/);
  });
});

describe('Audit Service - logAction Method', () => {
  it('has a logAction method', () => {
    const content = readService();
    expect(content).toMatch(/async\s+logAction/);
  });

  it('captures action parameter', () => {
    const content = readService();
    expect(content).toContain('action: params.action');
  });

  it('captures entityType parameter', () => {
    const content = readService();
    expect(content).toContain('entityType: params.entityType');
  });

  it('captures entityId parameter', () => {
    const content = readService();
    expect(content).toContain('entityId: params.entityId');
  });

  it('captures entityLabel parameter', () => {
    const content = readService();
    expect(content).toContain('entityLabel: params.entityLabel');
  });

  it('captures changes parameter', () => {
    const content = readService();
    expect(content).toContain('changes: params.changes');
  });

  it('captures metadata parameter', () => {
    const content = readService();
    expect(content).toContain('metadata: params.metadata');
  });

  it('resolves userId from getCurrentUser', () => {
    const content = readService();
    expect(content).toContain('getCurrentUser');
    expect(content).toContain('userId: authCtx?.userId');
  });
});

describe('Audit Service - Additional Methods', () => {
  it('has getEntityAuditTrail method', () => {
    const content = readService();
    expect(content).toMatch(/async\s+getEntityAuditTrail/);
  });

  it('has getRecentActivity method', () => {
    const content = readService();
    expect(content).toMatch(/async\s+getRecentActivity/);
  });

  it('has getUserActivity method', () => {
    const content = readService();
    expect(content).toMatch(/async\s+getUserActivity/);
  });
});

describe('Audit Service - Security', () => {
  it('does not expose secrets in log entries', () => {
    const content = readService();
    expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(content).not.toContain('service_role');
    expect(content).not.toContain('password');
    expect(content).not.toContain('secret');
  });

  it('does not log raw request headers or cookies', () => {
    const content = readService();
    expect(content).not.toContain('req.headers');
    expect(content).not.toContain('req.cookies');
    expect(content).not.toContain('request.headers');
  });

  it('uses null fallback for unauthenticated actions', () => {
    const content = readService();
    expect(content).toContain('authCtx?.userId ?? null');
  });
});
