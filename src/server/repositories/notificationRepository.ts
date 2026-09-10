import { db } from '@/server/db/client';
import { notifications, notificationPreferences } from '@/server/db/schema';
import { eq, and, desc, count, sql, isNull } from 'drizzle-orm';
import type { notificationCategoryEnum } from '@/server/db/schema/common';

type NotificationCategory = typeof notificationCategoryEnum.enumValues[number];

export interface NotificationRow {
  id: string;
  userId: string;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  status: 'unread' | 'read' | 'archived';
  link: string | null;
  metadata: Record<string, unknown> | null;
  eventKey: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedNotifications {
  notifications: NotificationRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class NotificationRepository {
  async create(data: {
    userId: string;
    type: string;
    category: NotificationCategory;
    title: string;
    body: string;
    status?: 'unread' | 'read' | 'archived';
    link?: string;
    metadata?: Record<string, unknown>;
    eventKey?: string;
  }): Promise<NotificationRow> {
    const [row] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        type: data.type,
        category: data.category,
        title: data.title,
        body: data.body,
        status: data.status ?? 'unread',
        link: data.link ?? null,
        metadata: data.metadata ?? null,
        eventKey: data.eventKey ?? null,
      })
      .returning();
    return row as NotificationRow;
  }

  async findByEventKey(eventKey: string): Promise<NotificationRow | null> {
    const [row] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.eventKey, eventKey), isNull(notifications.deletedAt)))
      .limit(1);
    return (row as NotificationRow) ?? null;
  }

  async findByUser(
    userId: string,
    opts: { page?: number; pageSize?: number; status?: string; category?: string } = {},
  ): Promise<PaginatedNotifications> {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [eq(notifications.userId, userId), isNull(notifications.deletedAt)];
    if (opts.status) conditions.push(eq(notifications.status, opts.status as 'unread' | 'read' | 'archived'));
    if (opts.category) conditions.push(eq(notifications.category, opts.category as NotificationCategory));

    const [{ total }] = await db
      .select({ total: count() })
      .from(notifications)
      .where(and(...conditions));

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      notifications: rows as NotificationRow[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.status, 'unread'), isNull(notifications.deletedAt)));
    return cnt;
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ status: 'read', readAt: new Date(), updatedAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ status: 'read', readAt: new Date(), updatedAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.status, 'unread'), isNull(notifications.deletedAt)));
    return result.count ?? 0;
  }

  async getPreference(userId: string, category: NotificationCategory) {
    const [pref] = await db
      .select()
      .from(notificationPreferences)
      .where(and(eq(notificationPreferences.userId, userId), eq(notificationPreferences.category, category)))
      .limit(1);
    return pref ?? null;
  }

  async upsertPreference(
    userId: string,
    category: NotificationCategory,
    data: { inAppEnabled?: boolean; emailEnabled?: boolean },
  ) {
    const existing = await this.getPreference(userId, category);
    if (existing) {
      await db
        .update(notificationPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(notificationPreferences.id, existing.id));
    } else {
      await db.insert(notificationPreferences).values({
        userId,
        category,
        inAppEnabled: data.inAppEnabled ?? true,
        emailEnabled: data.emailEnabled ?? true,
      });
    }
  }

  async getPreferences(userId: string) {
    return db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
  }

  async deletePreference(userId: string, category: NotificationCategory) {
    await db
      .delete(notificationPreferences)
      .where(and(eq(notificationPreferences.userId, userId), eq(notificationPreferences.category, category)));
  }
}
