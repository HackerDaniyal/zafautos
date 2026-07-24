'use server';

import { requireAuth } from '@/lib/auth';
import { auditService } from '@/server/services/auditService';

export async function getEntityAuditTrailAction(entityType: string, entityId: string) {
  await requireAuth();
  return auditService.getEntityAuditTrail(entityType, entityId);
}

export async function getRecentActivityAction(limit: number = 50) {
  await requireAuth();
  return auditService.getRecentActivity(limit);
}
