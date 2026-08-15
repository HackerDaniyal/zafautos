'use server';

import { requireAuth } from '@/lib/auth';
import { SettingsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const settingsService = new SettingsService();
const auditService = new AuditService();

export async function getCompanySettings(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.getCompanySettings();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateCompanySettings(data: {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  website?: string;
  address?: { street?: string; city?: string; state?: string; postalCode?: string; country?: string };
  taxId?: string;
  registrationNumber?: string;
  logoUrl?: string;
  faviconUrl?: string;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    const updated = await settingsService.updateCompanySettings(data, auth.userId);
    await auditService.logAction({
      action: 'company.updated',
      entityType: 'company',
      entityId: 'settings',
      entityLabel: data.companyName ?? 'Company Settings',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }])
      ),
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}
