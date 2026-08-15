'use server';

import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/auth/rbac';
import { AuditRepository, type AuditLogFilters } from '@/server/repositories/auditRepository';
import { auditService } from '@/server/services/auditService';
import { handleError, type ActionResult } from '@/lib/errors/action-error';

const auditRepo = new AuditRepository();

// ── Existing actions (preserved) ───────────────────────────────────────────

export async function getEntityAuditTrailAction(entityType: string, entityId: string) {
  await requireAuth();
  return auditService.getEntityAuditTrail(entityType, entityId);
}

export async function getRecentActivityAction(limit: number = 50) {
  await requireAuth();
  return auditService.getRecentActivity(limit);
}

// ── New: paginated audit log listing ───────────────────────────────────────

const MAX_LIMIT = 100;
const ALLOWED_LIMITS = [25, 50, 100];

function sanitizeLimit(limit: number): number {
  if (!ALLOWED_LIMITS.includes(limit)) return 25;
  return Math.min(limit, MAX_LIMIT);
}

function sanitizePage(page: number): number {
  return Math.max(1, Math.floor(page));
}

function sanitizeDateString(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export async function listAuditLogs(
  filters: AuditLogFilters = {},
  page: number = 1,
  limit: number = 25,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'admin', 'super_admin');

    const safeLimit = sanitizeLimit(limit);
    const safePage = sanitizePage(page);

    const sanitizedFilters: AuditLogFilters = {
      entityType: filters.entityType || undefined,
      action: filters.action || undefined,
      userId: filters.userId || undefined,
      from: sanitizeDateString(filters.from),
      to: sanitizeDateString(filters.to),
      search: filters.search?.trim().slice(0, 200) || undefined,
    };

    const result = await auditRepo.findPaginated(sanitizedFilters, safePage, safeLimit);
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function getAuditLog(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'admin', 'super_admin');

    const entry = await auditRepo.findById(id);
    if (!entry) {
      return { success: false, error: 'Audit log entry not found' };
    }

    return { success: true, data: entry };
  } catch (error) {
    return handleError(error);
  }
}
