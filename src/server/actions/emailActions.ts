'use server';

import { requireAuth } from '@/lib/auth';
import { SettingsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const settingsService = new SettingsService();
const auditService = new AuditService();

export async function listEmailTemplates(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.listEmailTemplates();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function listActiveEmailTemplates(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.listActiveEmailTemplates();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getEmailTemplate(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.getEmailTemplate(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createEmailTemplate(data: {
  name: string;
  key: string;
  description?: string;
  subject?: string;
  body?: string;
  isActive?: boolean;
}): Promise<ActionResult> {
  try {
    await requireAuth();
    const created = await settingsService.createEmailTemplate({
      name: data.name,
      key: data.key,
      description: data.description,
      subject: data.subject,
      body: data.body,
      isActive: data.isActive ?? true,
    });
    await auditService.logAction({
      action: 'email_template.created',
      entityType: 'email_template',
      entityId: (created as { id: string }).id,
      entityLabel: data.name,
      changes: { name: { old: null, new: data.name }, key: { old: null, new: data.key } },
    });
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateEmailTemplate(id: string, data: {
  name?: string;
  key?: string;
  description?: string;
  subject?: string;
  body?: string;
  isActive?: boolean;
}): Promise<ActionResult> {
  try {
    await requireAuth();
    const updated = await settingsService.updateEmailTemplate(id, data);
    await auditService.logAction({
      action: 'email_template.updated',
      entityType: 'email_template',
      entityId: id,
      entityLabel: data.name ?? 'Email Template',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }])
      ),
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteEmailTemplate(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await settingsService.deleteEmailTemplate(id);
    await auditService.logAction({
      action: 'email_template.deleted',
      entityType: 'email_template',
      entityId: id,
      entityLabel: 'Email Template',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreEmailTemplate(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await settingsService.restoreEmailTemplate(id);
    await auditService.logAction({
      action: 'email_template.restored',
      entityType: 'email_template',
      entityId: id,
      entityLabel: 'Email Template',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function listEmailLogs(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.listEmailLogs();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}
