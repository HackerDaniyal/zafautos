'use server';

import { requireAuth } from '@/lib/auth/session';
import { db } from '@/server/db/client';
import {
  customers,
  customerProfiles,
  profiles,
  users,
  orders,
  orderItems,
  orderStatus,
  orderTimeline,
  orderDocuments,
  payments,
  shipments,
  shipmentTracking,
  shippingDocuments,
  documents,
  messages,
  messageThreads,
  notifications,
  vehicles,
  vehicleImages,
  manufacturers,
  models,
} from '@/server/db/schema';
import { eq, and, desc, asc, count, inArray, type SQL } from 'drizzle-orm';
import { formatPrice } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

// ─── Profile ───────────────────────────────────────────────────────────────

export async function getMyProfile() {
  const auth = await requireAuth();

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      status: users.status,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      phone: profiles.phone,
      avatarUrl: profiles.avatarUrl,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.id, auth.userId))
    .limit(1);

  if (!user) return null;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, auth.userId))
    .limit(1);

  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    customerId: customer?.id ?? null,
  };
}

export async function updateMyProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}) {
  const auth = await requireAuth();

  await db
    .update(profiles)
    .set({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, auth.userId));

  revalidatePath('/account/profile');
  return { success: true };
}

// ─── Orders ────────────────────────────────────────────────────────────────

export async function getMyOrders(params?: { status?: string; page?: number; pageSize?: number }) {
  const auth = await requireAuth();

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, auth.userId))
    .limit(1);

  if (!customer) return { orders: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [
    eq(orders.customerId, customer.id),
  ];
  if (params?.status) {
    conditions.push(eq(orders.status, params.status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'));
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(orders)
    .where(and(...conditions));

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      vehicleId: orders.vehicleId,
    })
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Enrich with vehicle info
  const enriched = await Promise.all(
    rows.map(async (o) => {
      let vehicle: { make: string | null; model: string | null; year: number | null; stockNumber: string | null } | null = null;
      if (o.vehicleId) {
        const [v] = await db
          .select({
            year: vehicles.year,
            stockNumber: vehicles.stockNumber,
            manufacturerName: manufacturers.name,
            modelName: models.name,
          })
          .from(vehicles)
          .leftJoin(manufacturers, eq(vehicles.manufacturerId, manufacturers.id))
          .leftJoin(models, eq(vehicles.modelId, models.id))
          .where(eq(vehicles.id, o.vehicleId))
          .limit(1);
        if (v) {
          vehicle = { make: v.manufacturerName, model: v.modelName, year: v.year, stockNumber: v.stockNumber };
        }
      }
      return { ...o, vehicle };
    })
  );

  return {
    orders: enriched,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getMyOrderDetail(orderId: string) {
  const auth = await requireAuth();

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, auth.userId))
    .limit(1);

  if (!customer) return null;

  // Verify ownership
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customerId, customer.id)))
    .limit(1);

  if (!order) return null;

  // Vehicle
  let vehicle: { make: string | null; model: string | null; year: number | null; stockNumber: string | null; imageUrl: string | null } | null = null;
  if (order.vehicleId) {
    const [v] = await db
      .select({
        year: vehicles.year,
        stockNumber: vehicles.stockNumber,
        manufacturerName: manufacturers.name,
        modelName: models.name,
      })
      .from(vehicles)
      .leftJoin(manufacturers, eq(vehicles.manufacturerId, manufacturers.id))
      .leftJoin(models, eq(vehicles.modelId, models.id))
      .where(eq(vehicles.id, order.vehicleId))
      .limit(1);
    if (v) {
      const [img] = await db
        .select({ imageUrl: vehicleImages.imageUrl })
        .from(vehicleImages)
        .where(eq(vehicleImages.vehicleId, order.vehicleId))
        .limit(1);
      vehicle = { make: v.manufacturerName, model: v.modelName, year: v.year, stockNumber: v.stockNumber, imageUrl: img?.imageUrl ?? null };
    }
  }

  // Payments
  const orderPayments = await db
    .select({
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(and(eq(payments.orderId, orderId), eq(payments.deletedAt, null as unknown as Date)))
    .orderBy(desc(payments.createdAt));

  const totalPaid = orderPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Shipments with tracking
  const orderShipments = await db
    .select({
      id: shipments.id,
      status: shipments.status,
      carrier: shipments.carrier,
      trackingNumber: shipments.trackingNumber,
      vessel: shipments.vessel,
      estimatedArrival: shipments.estimatedArrival,
    })
    .from(shipments)
    .where(and(eq(shipments.orderId, orderId), eq(shipments.deletedAt, null as unknown as Date)))
    .orderBy(desc(shipments.createdAt));

  // Timeline
  const timeline = await db
    .select({
      event: orderTimeline.event,
      createdAt: orderTimeline.createdAt,
    })
    .from(orderTimeline)
    .where(eq(orderTimeline.orderId, orderId))
    .orderBy(desc(orderTimeline.createdAt));

  // Status history
  const statusHistory = await db
    .select({
      status: orderStatus.status,
      note: orderStatus.note,
      createdAt: orderStatus.createdAt,
    })
    .from(orderStatus)
    .where(eq(orderStatus.orderId, orderId))
    .orderBy(desc(orderStatus.createdAt));

  // Documents (order + shipping)
  const orderDocs = await db
    .select({
      id: orderDocuments.id,
      documentUrl: orderDocuments.documentUrl,
      createdAt: orderDocuments.createdAt,
    })
    .from(orderDocuments)
    .where(eq(orderDocuments.orderId, orderId))
    .orderBy(desc(orderDocuments.createdAt));

  const shipmentDocs = await db
    .select({
      id: shippingDocuments.id,
      documentUrl: shippingDocuments.documentUrl,
      documentType: shippingDocuments.documentType,
      documentName: shippingDocuments.documentName,
      createdAt: shippingDocuments.createdAt,
    })
    .from(shippingDocuments)
    .where(and(
      eq(shippingDocuments.deletedAt, null as unknown as Date),
      inArray(shippingDocuments.shipmentId, await db.select({ id: shipments.id }).from(shipments).where(eq(shipments.orderId, orderId)).then((rows) => rows.map((r) => r.id))),
    ))
    .orderBy(desc(shippingDocuments.createdAt));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    vehicle,
    payments: orderPayments,
    paymentSummary: {
      totalAmount: order.totalAmount,
      totalPaid,
      balance: order.totalAmount - totalPaid,
    },
    shipments: orderShipments,
    timeline,
    statusHistory,
    orderDocuments: orderDocs,
    shippingDocuments: shipmentDocs,
  };
}

// ─── Documents ─────────────────────────────────────────────────────────────

export async function getMyDocuments(params?: { page?: number; pageSize?: number }) {
  const auth = await requireAuth();

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, auth.userId))
    .limit(1);

  if (!customer) return { documents: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  // Get customer's order IDs
  const customerOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.customerId, customer.id));

  const orderIds = customerOrders.map((o) => o.id);

  if (orderIds.length === 0) {
    return { documents: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(orderDocuments)
    .where(and(eq(orderDocuments.deletedAt, null as unknown as Date), inArray(orderDocuments.orderId, orderIds)));

  const orderDocs = await db
    .select({
      id: orderDocuments.id,
      orderId: orderDocuments.orderId,
      documentUrl: orderDocuments.documentUrl,
      createdAt: orderDocuments.createdAt,
    })
    .from(orderDocuments)
    .where(and(eq(orderDocuments.deletedAt, null as unknown as Date), inArray(orderDocuments.orderId, orderIds)))
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(orderDocuments.createdAt));

  // Also get shipping documents for customer's orders
  const customerShipments = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(inArray(shipments.orderId, orderIds));
  const shipmentIds = customerShipments.map((s) => s.id);

  const shipDocs = shipmentIds.length > 0 ? await db
    .select({
      id: shippingDocuments.id,
      shipmentId: shippingDocuments.shipmentId,
      documentUrl: shippingDocuments.documentUrl,
      documentType: shippingDocuments.documentType,
      documentName: shippingDocuments.documentName,
      createdAt: shippingDocuments.createdAt,
    })
    .from(shippingDocuments)
    .where(and(eq(shippingDocuments.deletedAt, null as unknown as Date), inArray(shippingDocuments.shipmentId, shipmentIds)))
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(shippingDocuments.createdAt)) : [];

  return {
    orderDocuments: orderDocs,
    shippingDocuments: shipDocs,
  };
}

// ─── Messages ──────────────────────────────────────────────────────────────

export async function getMyMessageThreads() {
  const auth = await requireAuth();

  // Get threads where user is sender or recipient
  const threads = await db
    .select({
      id: messageThreads.id,
      subject: messageThreads.subject,
      createdAt: messageThreads.createdAt,
      updatedAt: messageThreads.updatedAt,
    })
    .from(messageThreads)
    .where(eq(messageThreads.deletedAt, null as unknown as Date))
    .orderBy(desc(messageThreads.updatedAt));

  // For each thread, get the last message and unread count
  const enriched = await Promise.all(
    threads.map(async (thread) => {
      const [lastMsg] = await db
        .select({
          content: messages.content,
          createdAt: messages.createdAt,
          senderId: messages.senderId,
        })
        .from(messages)
        .where(and(eq(messages.threadId, thread.id), eq(messages.deletedAt, null as unknown as Date)))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const [unread] = await db
        .select({ count: count() })
        .from(messages)
        .where(
          and(
            eq(messages.threadId, thread.id),
            eq(messages.recipientId, auth.userId),
            eq(messages.isRead, false),
            eq(messages.deletedAt, null as unknown as Date)
          )
        );

      return {
        ...thread,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.createdAt ?? null,
        lastMessageSenderId: lastMsg?.senderId ?? null,
        unreadCount: unread?.count ?? 0,
      };
    })
  );

  return enriched.filter((t) => t.lastMessage !== null);
}

export async function getMyThreadDetail(threadId: string) {
  const auth = await requireAuth();

  const [thread] = await db
    .select()
    .from(messageThreads)
    .where(and(eq(messageThreads.id, threadId), eq(messageThreads.deletedAt, null as unknown as Date)))
    .limit(1);

  if (!thread) return null;

  // Get messages in thread with sender info
  const threadMessages = await db
    .select({
      id: messages.id,
      content: messages.content,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      senderEmail: users.email,
      senderFirstName: profiles.firstName,
      senderLastName: profiles.lastName,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(and(eq(messages.threadId, threadId), eq(messages.deletedAt, null as unknown as Date)))
    .orderBy(asc(messages.createdAt));

  // Mark unread messages as read
  await db
    .update(messages)
    .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(messages.threadId, threadId),
        eq(messages.recipientId, auth.userId),
        eq(messages.isRead, false)
      )
    );

  return {
    ...thread,
    messages: threadMessages,
  };
}

export async function sendMessage(data: { threadId?: string; recipientId: string; subject?: string; content: string }) {
  const auth = await requireAuth();

  let threadId = data.threadId;

  // Create new thread if needed
  if (!threadId) {
    const [newThread] = await db
      .insert(messageThreads)
      .values({
        subject: data.subject || 'New Message',
      })
      .returning({ id: messageThreads.id });
    threadId = newThread.id;
  }

  // Insert message
  await db.insert(messages).values({
    threadId: threadId,
    senderId: auth.userId,
    recipientId: data.recipientId,
    content: data.content,
  });

  // Update thread timestamp
  await db
    .update(messageThreads)
    .set({ updatedAt: new Date() })
    .where(eq(messageThreads.id, threadId));

  revalidatePath('/account/messages');
  revalidatePath(`/account/messages/${threadId}`);
  return { success: true, threadId };
}

// ─── Notifications ─────────────────────────────────────────────────────────

export async function getMyNotifications(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
}) {
  const auth = await requireAuth();
  const { NotificationRepository } = await import('@/server/repositories/notificationRepository');
  const repo = new NotificationRepository();
  const result = await repo.findByUser(auth.userId, {
    page: params?.page,
    pageSize: params?.pageSize,
    status: params?.status,
    category: params?.category,
  });
  return result;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const auth = await requireAuth();
  const { NotificationRepository } = await import('@/server/repositories/notificationRepository');
  const repo = new NotificationRepository();
  return repo.getUnreadCount(auth.userId);
}

export async function markNotificationRead(notificationId: string) {
  const auth = await requireAuth();
  const { NotificationRepository } = await import('@/server/repositories/notificationRepository');
  const repo = new NotificationRepository();
  await repo.markRead(notificationId, auth.userId);
  revalidatePath('/account/notifications');
  return { success: true };
}

export async function markAllNotificationsRead() {
  const auth = await requireAuth();
  const { NotificationRepository } = await import('@/server/repositories/notificationRepository');
  const repo = new NotificationRepository();
  await repo.markAllRead(auth.userId);
  revalidatePath('/account/notifications');
  return { success: true };
}

export async function getNotificationPreferences() {
  const auth = await requireAuth();
  const { NotificationRepository } = await import('@/server/repositories/notificationRepository');
  const repo = new NotificationRepository();
  return repo.getPreferences(auth.userId);
}

export async function updateNotificationPreference(category: string, data: { inAppEnabled?: boolean; emailEnabled?: boolean }) {
  const auth = await requireAuth();
  const { NotificationRepository } = await import('@/server/repositories/notificationRepository');
  const repo = new NotificationRepository();
  await repo.upsertPreference(auth.userId, category as 'order' | 'payment' | 'shipping' | 'support' | 'lead' | 'vehicle' | 'system', data);
  revalidatePath('/account/notifications');
  return { success: true };
}
