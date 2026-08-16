import { db } from '@/server/db/client';
import {
  vehicles, orders, payments, shipments, auditLogs,
  invoices,
} from '@/server/db/schema';
import {
  pageViews, searchHistory,
} from '@/server/db/schema/analytics';
import { vehicleViews } from '@/server/db/schema/marketplace';
import { users } from '@/server/db/schema/auth';
import { customers } from '@/server/db/schema/customers';
import { dealers } from '@/server/db/schema/dealers';
import { sql, desc, and } from 'drizzle-orm';

export class DashboardRepository {
  // ── Snapshot Metrics (current state, NOT date-filtered) ─────────────────

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

  async getUserStats() {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.deletedAt} IS NULL`);

    const [customerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers);

    const [dealerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dealers);

    return {
      users: userCount?.count ?? 0,
      customers: customerCount?.count ?? 0,
      dealers: dealerCount?.count ?? 0,
    };
  }

  async getPendingRevenue() {
    const [stats] = await db
      .select({
        total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(sql`${orders.status} = 'pending' AND ${orders.deletedAt} IS NULL`);

    return { total: stats?.total ?? 0, count: stats?.count ?? 0 };
  }

  // ── Period Metrics (date-range filtered) ────────────────────────────────

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

  /**
   * Revenue = SUM(totalAmount) WHERE status IN (confirmed, processing, shipped, delivered).
   * Excludes pending (not yet committed) and cancelled (rejected).
   */
  async getRevenue(dateFrom?: Date, dateTo?: Date) {
    const conditions = [
      sql`${orders.deletedAt} IS NULL`,
      sql`${orders.status} IN ('confirmed', 'processing', 'shipped', 'delivered')`,
    ];
    if (dateFrom) conditions.push(sql`${orders.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${orders.createdAt} <= ${dateTo}`);

    const [stats] = await db
      .select({
        total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(...conditions));

    return { revenue: stats?.total ?? 0, orderCount: stats?.count ?? 0 };
  }

  async getRevenueByMonth(dateFrom?: Date, dateTo?: Date) {
    const conditions = [
      sql`${orders.deletedAt} IS NULL`,
      sql`${orders.status} IN ('confirmed', 'processing', 'shipped', 'delivered')`,
    ];
    if (dateFrom) conditions.push(sql`${orders.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${orders.createdAt} <= ${dateTo}`);

    const rows = await db
      .select({
        month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
      })
      .from(orders)
      .where(and(...conditions))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

    return rows.map((r) => ({
      month: r.month,
      label: new Date(r.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      revenue: r.revenue,
    }));
  }

  async getOrdersByMonth(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${orders.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${orders.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${orders.createdAt} <= ${dateTo}`);

    const rows = await db
      .select({
        month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
        orders: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(...conditions))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

    return rows.map((r) => ({
      month: r.month,
      label: new Date(r.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      orders: r.orders,
    }));
  }

  async getOrderStatusBreakdown(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${orders.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${orders.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${orders.createdAt} <= ${dateTo}`);

    const rows = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(...conditions))
      .groupBy(orders.status);

    return rows.map((r) => ({ status: r.status, count: r.count }));
  }

  async getShipmentStatusBreakdown() {
    const rows = await db
      .select({
        status: shipments.status,
        count: sql<number>`count(*)::int`,
      })
      .from(shipments)
      .where(sql`${shipments.deletedAt} IS NULL`)
      .groupBy(shipments.status);

    return rows.map((r) => ({ status: r.status, count: r.count }));
  }

  async getPaymentStatusBreakdown(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${payments.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${payments.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${payments.createdAt} <= ${dateTo}`);

    const rows = await db
      .select({
        status: payments.status,
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
      })
      .from(payments)
      .where(and(...conditions))
      .groupBy(payments.status);

    return rows.map((r) => ({ status: r.status, count: r.count, total: r.total }));
  }

  async getPaymentMethodBreakdown(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${payments.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${payments.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${payments.createdAt} <= ${dateTo}`);

    const rows = await db
      .select({
        method: payments.paymentMethod,
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
      })
      .from(payments)
      .where(and(...conditions))
      .groupBy(payments.paymentMethod);

    return rows.map((r) => ({ method: r.method ?? 'unknown', count: r.count, total: r.total }));
  }

  async getInvoiceStats() {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        draft: sql<number>`count(*) filter (where ${invoices.status} = 'draft')::int`,
        sent: sql<number>`count(*) filter (where ${invoices.status} = 'sent')::int`,
        paid: sql<number>`count(*) filter (where ${invoices.status} = 'paid')::int`,
        overdue: sql<number>`count(*) filter (where ${invoices.status} = 'overdue')::int`,
        cancelled: sql<number>`count(*) filter (where ${invoices.status} = 'cancelled')::int`,
        totalAmount: sql<number>`coalesce(sum(${invoices.total}), 0)::int`,
        balanceDue: sql<number>`coalesce(sum(${invoices.balanceDue}), 0)::int`,
      })
      .from(invoices)
      .where(sql`${invoices.deletedAt} IS NULL`);

    return stats ?? {
      total: 0, draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0,
      totalAmount: 0, balanceDue: 0,
    };
  }

  // ── Engagement Metrics (date-range filtered) ────────────────────────────

  async getPageViewStats(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${pageViews.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${pageViews.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${pageViews.createdAt} <= ${dateTo}`);

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pageViews)
      .where(and(...conditions));

    const topPaths = await db
      .select({
        path: pageViews.path,
        count: sql<number>`count(*)::int`,
      })
      .from(pageViews)
      .where(and(...conditions))
      .groupBy(pageViews.path)
      .orderBy(desc(sql<number>`count(*)::int`))
      .limit(10);

    return {
      total: total?.count ?? 0,
      topPaths: topPaths.map((r) => ({ path: r.path, count: r.count })),
    };
  }

  async getVehicleViewStats(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${vehicleViews.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${vehicleViews.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${vehicleViews.createdAt} <= ${dateTo}`);

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vehicleViews)
      .where(and(...conditions));

    const topVehicles = await db
      .select({
        vehicleId: vehicleViews.vehicleId,
        count: sql<number>`count(*)::int`,
      })
      .from(vehicleViews)
      .where(and(...conditions))
      .groupBy(vehicleViews.vehicleId)
      .orderBy(desc(sql<number>`count(*)::int`))
      .limit(10);

    return {
      total: total?.count ?? 0,
      topVehicles: topVehicles.map((r) => ({ vehicleId: r.vehicleId, count: r.count })),
    };
  }

  async getSearchStats(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${searchHistory.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${searchHistory.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${searchHistory.createdAt} <= ${dateTo}`);

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(searchHistory)
      .where(and(...conditions));

    const topSearches = await db
      .select({
        query: searchHistory.query,
        count: sql<number>`count(*)::int`,
      })
      .from(searchHistory)
      .where(and(...conditions))
      .groupBy(searchHistory.query)
      .orderBy(desc(sql<number>`count(*)::int`))
      .limit(10);

    return {
      total: total?.count ?? 0,
      topSearches: topSearches.map((r) => ({ query: r.query, count: r.count })),
    };
  }

  // ── Legacy methods (preserved for existing dashboard) ────────────────────

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
