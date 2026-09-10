import { getCurrentUser } from '@/lib/auth';
import { AuditRepository } from '@/server/repositories';
import type { AuditLogInsert } from '@/server/repositories';

const auditRepo = new AuditRepository();

export interface LogActionParams {
  action: string;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Logs an action to the audit trail. Uses getCurrentUser() so it never
   * throws for unauthenticated / system-initiated actions (userId will be null).
   */
  async logAction(params: LogActionParams): Promise<void> {
    const authCtx = await getCurrentUser();

    const entry: AuditLogInsert = {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel: params.entityLabel ?? null,
      userId: authCtx?.userId ?? null,
      changes: params.changes ?? null,
      metadata: params.metadata ?? null,
    };

    await auditRepo.log(entry);
  }

  async getEntityAuditTrail(entityType: string, entityId: string) {
    return auditRepo.findByEntity(entityType, entityId);
  }

  async getRecentActivity(limit: number = 50) {
    return auditRepo.findRecent(limit);
  }

  async getUserActivity(userId: string) {
    return auditRepo.findByUser(userId);
  }
}

export const auditService = new AuditService();
