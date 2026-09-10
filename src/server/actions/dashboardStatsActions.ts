'use server';

import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/auth/rbac';
import { DashboardService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';

const dashboardService = new DashboardService();

export async function getDashboardStats(dateFrom?: string, dateTo?: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'admin', 'super_admin');
    const from = dateFrom ? new Date(dateFrom) : undefined;
    const to = dateTo ? new Date(dateTo) : undefined;
    const stats = await dashboardService.getDashboardStats(from, to);
    return { success: true, data: stats };
  } catch (error) {
    return handleError(error);
  }
}
