'use server';

import { requireAuth } from '@/lib/auth';
import { SettingsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const settingsService = new SettingsService();
const auditService = new AuditService();

export async function listNotificationRules(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.listNotificationRules();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getNotificationRule(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.getNotificationRule(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function seedDefaultNotificationRules(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.seedDefaultNotificationRules();
    await auditService.logAction({
      action: 'notification_rules.seeded',
      entityType: 'notification_rule',
      entityId: 'system',
      entityLabel: 'Default notification rules',
    });
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateNotificationRule(id: string, data: {
  isEnabled?: boolean;
  sendInApp?: boolean;
  sendEmail?: boolean;
}): Promise<ActionResult> {
  try {
    await requireAuth();
    const updated = await settingsService.updateNotificationRule(id, data);
    await auditService.logAction({
      action: 'notification_rule.updated',
      entityType: 'notification_rule',
      entityId: id,
      entityLabel: 'Notification Rule',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }])
      ),
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkUpdateNotificationRules(updates: Array<{
  id: string;
  isEnabled?: boolean;
  sendInApp?: boolean;
  sendEmail?: boolean;
}>): Promise<ActionResult> {
  try {
    await requireAuth();
    await settingsService.bulkUpdateNotificationRules(updates);
    await auditService.logAction({
      action: 'notification_rules.bulk_updated',
      entityType: 'notification_rule',
      entityId: 'bulk',
      entityLabel: `${updates.length} rules updated`,
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
