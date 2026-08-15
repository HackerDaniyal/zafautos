'use server';

import { requireAuth } from '@/lib/auth';
import { SettingsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const settingsService = new SettingsService();
const auditService = new AuditService();

export async function getStorageOverview(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.getStorageOverview();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getStorageConfig(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.getStorageConfig();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateStorageConfig(data: {
  maxFileSizeMB?: number;
  allowedMimeTypes?: string[];
  cdnUrl?: string;
  enableImageOptimization?: boolean;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    const updated = await settingsService.updateStorageConfig(data, auth.userId);
    await auditService.logAction({
      action: 'storage.updated',
      entityType: 'storage',
      entityId: 'config',
      entityLabel: 'Storage Config',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }])
      ),
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}
