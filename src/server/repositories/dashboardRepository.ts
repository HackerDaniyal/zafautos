import { db } from '@/server/db/client';
import { vehicles, orders, payments, shipments, auditLogs } from '@/server/db/schema';
import { sql, desc, and } from 'drizzle-orm';

export class DashboardRepository {
  async getVehicleStats() {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${vehicles.status} = 'active')::int`,
        sold: sql<number>`count(*) filter (where ${vehicles.status} = 'sold')::int`,
        draft: sql<number>`count(*) filter (where ${vehicles.status} = 'draft')::int`,
        archived: sql<number>`count(*) filter (where ${vehicles.status} = 'archived')::int`,
      })
      .from(vehicles)
      .where(sql`${vehicles.deletedAt} IS NULL`);

    return stats ?? { total: 0, active: 0, sold: 0, draft: 0, archived: 0 };
  }

  async getOrderStats(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${orders.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${orders.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${orders.createdAt} <= ${dateTo}`);

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
      })
      .from(orders)
      .where(and(...conditions));

    return stats ?? { total: 0, revenue: 0 };
  }

  async getPaymentStats() {
    const [pending] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .where(sql`${payments.status} = 'pending' AND ${payments.deletedAt} IS NULL`);

    const [failed] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .where(sql`${payments.status} = 'failed' AND ${payments.deletedAt} IS NULL`);

    return {
      pendingCount: pending?.count ?? 0,
      failedCount: failed?.count ?? 0,
    };
  }

  async getShipmentStats() {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        inTransit: sql<number>`count(*) filter (where ${shipments.status} = 'in_transit')::int`,
        delayed: sql<number>`count(*) filter (where ${shipments.status} = 'delayed')::int`,
      })
      .from(shipments)
      .where(sql`${shipments.deletedAt} IS NULL`);

    return stats ?? { total: 0, inTransit: 0, delayed: 0 };
  }

  async getRecentOrders(limit: number = 5) {
    return db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(sql`${orders.deletedAt} IS NULL`)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async getRevenueByMonth(months: number = 6) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const rows = await db
      .select({
        month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
      })
      .from(orders)
      .where(sql`${orders.deletedAt} IS NULL AND ${orders.createdAt} >= ${cutoff}`)
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

    return rows.map((r) => ({
      month: r.month,
      label: new Date(r.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      revenue: r.revenue,
    }));
  }

  async getOrdersByMonth(months: number = 6) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const rows = await db
      .select({
        month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
        orders: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(sql`${orders.deletedAt} IS NULL AND ${orders.createdAt} >= ${cutoff}`)
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

    return rows.map((r) => ({
      month: r.month,
      label: new Date(r.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      orders: r.orders,
    }));
  }

  async getRecentActivity(limit: number = 10) {
    return db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        entityLabel: auditLogs.entityLabel,
        userId: auditLogs.userId,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getAlerts() {
    const [draftVehicles] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vehicles)
      .where(sql`${vehicles.status} = 'draft' AND ${vehicles.deletedAt} IS NULL`);

    const [delayedShipments] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shipments)
      .where(sql`${shipments.status} = 'delayed' AND ${shipments.deletedAt} IS NULL`);

    const [pendingPayments] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .where(sql`${payments.status} = 'pending' AND ${payments.deletedAt} IS NULL`);

    const [failedPayments] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .where(sql`${payments.status} = 'failed' AND ${payments.deletedAt} IS NULL`);

    return {
      draftVehicles: draftVehicles?.count ?? 0,
      delayedShipments: delayedShipments?.count ?? 0,
      pendingPayments: pendingPayments?.count ?? 0,
      failedPayments: failedPayments?.count ?? 0,
    };
  }
}
