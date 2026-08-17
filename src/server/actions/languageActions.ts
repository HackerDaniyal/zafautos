'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { SettingsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const settingsService = new SettingsService();
const auditService = new AuditService();

export async function listLanguages(options: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: { column?: string; direction?: 'asc' | 'desc' };
} = {}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.read');
    const data = await settingsService.listLanguages(options);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getLanguage(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.read');
    const data = await settingsService.getLanguage(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createLanguage(data: {
  name: string;
  code: string;
  isActive?: boolean;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    const created = await settingsService.createLanguage(data);
    await auditService.logAction({
      action: 'language.created',
      entityType: 'language',
      entityId: (created as { id: string }).id,
      entityLabel: data.name,
    });
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateLanguage(id: string, data: {
  name?: string;
  code?: string;
  isActive?: boolean;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    const updated = await settingsService.updateLanguage(id, data);
    await auditService.logAction({
      action: 'language.updated',
      entityType: 'language',
      entityId: id,
      entityLabel: data.name ?? 'Language',
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteLanguage(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    await settingsService.deleteLanguage(id);
    await auditService.logAction({
      action: 'language.deleted',
      entityType: 'language',
      entityId: id,
      entityLabel: 'Language',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreLanguage(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    await settingsService.restoreLanguage(id);
    await auditService.logAction({
      action: 'language.restored',
      entityType: 'language',
      entityId: id,
      entityLabel: 'Language',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
