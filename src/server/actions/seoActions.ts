'use server';

import { requireAuth } from '@/lib/auth';
import { SettingsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const settingsService = new SettingsService();
const auditService = new AuditService();

export async function getSeoSettings(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.getSeoSettings();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSeoSettings(data: {
  siteTitle?: string;
  siteDescription?: string;
  defaultKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  twitterCreator?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  sitemapEnabled?: boolean;
  faviconUrl?: string;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    const updated = await settingsService.updateSeoSettings(data, auth.userId);
    await auditService.logAction({
      action: 'seo.updated',
      entityType: 'seo',
      entityId: 'settings',
      entityLabel: 'SEO Settings',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }])
      ),
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}
