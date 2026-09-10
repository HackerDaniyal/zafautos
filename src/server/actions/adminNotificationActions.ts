'use server';

import { requireAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import { NotificationRepository } from '@/server/repositories/notificationRepository';
import { handleError, type ActionResult } from '@/lib/errors/action-error';

const notificationRepo = new NotificationRepository();

export async function getAdminNotifications(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'notifications.read');
    const result = await notificationRepo.findByUser(auth.userId, {
      page: params?.page,
      pageSize: params?.pageSize,
      status: params?.status,
      category: params?.category,
    });
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function getAdminUnreadCount(): Promise<ActionResult<number>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'notifications.read');
    const count = await notificationRepo.getUnreadCount(auth.userId);
    return { success: true, data: count };
  } catch (error) {
    return handleError(error);
  }
}

export async function markAdminNotificationRead(notificationId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'notifications.read');
    await notificationRepo.markRead(notificationId, auth.userId);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function markAllAdminNotificationsRead(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'notifications.read');
    await notificationRepo.markAllRead(auth.userId);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
