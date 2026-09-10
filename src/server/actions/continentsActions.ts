'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { SettingsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const settingsService = new SettingsService();
const auditService = new AuditService();

export async function listContinents(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.read');
    const data = await settingsService.listContinents();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function listContinentsWithCount(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.read');
    const data = await settingsService.listContinentsWithCount();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getContinent(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.read');
    const data = await settingsService.getContinent(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createContinent(data: { name: string; slug?: string; isActive?: boolean; displayOrder?: number }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    const created = await settingsService.createContinent({
      name: data.name,
      slug: data.slug,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
    });
    await auditService.logAction({
      action: 'continent.created',
      entityType: 'continent',
      entityId: (created as { id: string }).id,
      entityLabel: data.name,
      changes: { name: { old: null, new: data.name } },
    });
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateContinent(id: string, data: { name?: string; slug?: string; isActive?: boolean; displayOrder?: number }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    const updated = await settingsService.updateContinent(id, data);
    await auditService.logAction({
      action: 'continent.updated',
      entityType: 'continent',
      entityId: id,
      entityLabel: data.name ?? 'Continent',
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteContinent(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    await settingsService.deleteContinent(id);
    await auditService.logAction({
      action: 'continent.deleted',
      entityType: 'continent',
      entityId: id,
      entityLabel: 'Continent',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreContinent(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    await settingsService.restoreContinent(id);
    await auditService.logAction({
      action: 'continent.restored',
      entityType: 'continent',
      entityId: id,
      entityLabel: 'Continent',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
