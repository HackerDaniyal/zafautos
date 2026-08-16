'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { DashboardService } from '@/server/services/dashboardService';
import { handleError, type ActionResult } from '@/lib/errors/action-error';

const dashboardService = new DashboardService();

function sanitizeDateString(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (isNaN(date.getTime())) return undefined;
  return date;
}

export async function getAnalyticsDashboard(
  dateFrom?: string,
  dateTo?: string,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'analytics.read');

    const from = sanitizeDateString(dateFrom);
    const to = sanitizeDateString(dateTo);

    const stats = await dashboardService.getAnalyticsDashboard(from, to);
    return { success: true, data: stats };
  } catch (error) {
    return handleError(error);
  }
}
