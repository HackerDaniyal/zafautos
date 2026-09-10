import { db } from '@/server/db/client';
import {
  vehicles, orders, payments, shipments, auditLogs,
  invoices,
} from '@/server/db/schema';
import {
  pageViews, searchHistory,
} from '@/server/db/schema/analytics';
import { vehicleViews, vehicleEnquiries, whatsappClicks } from '@/server/db/schema/marketplace';
import { supportTickets, supportTicketMessages } from '@/server/db/schema/support';
import { users } from '@/server/db/schema/auth';
import { customers } from '@/server/db/schema/customers';
import { dealers } from '@/server/db/schema/dealers';
import { sql, desc, and, eq } from 'drizzle-orm';

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

  // ── Support Analytics ────────────────────────────────────────────────────

  async getSupportStats(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${supportTickets.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${supportTickets.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${supportTickets.createdAt} <= ${dateTo}`);

    const [totals] = await db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${supportTickets.status} = 'open')::int`,
        inProgress: sql<number>`count(*) filter (where ${supportTickets.status} = 'in_progress')::int`,
        resolved: sql<number>`count(*) filter (where ${supportTickets.status} = 'resolved')::int`,
        closed: sql<number>`count(*) filter (where ${supportTickets.status} = 'closed')::int`,
      })
      .from(supportTickets)
      .where(and(...conditions));

    const statusBreakdown = await db
      .select({
        status: supportTickets.status,
        count: sql<number>`count(*)::int`,
      })
      .from(supportTickets)
      .where(and(...conditions))
      .groupBy(supportTickets.status);

    const priorityBreakdown = await db
      .select({
        priority: supportTickets.priority,
        count: sql<number>`count(*)::int`,
      })
      .from(supportTickets)
      .where(and(...conditions))
      .groupBy(supportTickets.priority);

    const categoryBreakdown = await db
      .select({
        category: supportTickets.category,
        count: sql<number>`count(*)::int`,
      })
      .from(supportTickets)
      .where(and(...conditions))
      .groupBy(supportTickets.category);

    return {
      total: totals?.total ?? 0,
      open: totals?.open ?? 0,
      inProgress: totals?.inProgress ?? 0,
      resolved: totals?.resolved ?? 0,
      closed: totals?.closed ?? 0,
      statusBreakdown: statusBreakdown.map((r) => ({ status: r.status, count: r.count })),
      priorityBreakdown: priorityBreakdown.map((r) => ({ priority: r.priority, count: r.count })),
      categoryBreakdown: categoryBreakdown.map((r) => ({ category: r.category, count: r.count })),
    };
  }

  // ── Lead / Conversion Analytics ──────────────────────────────────────────

  async getLeadStats(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${vehicleEnquiries.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${vehicleEnquiries.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${vehicleEnquiries.createdAt} <= ${dateTo}`);

    const [totals] = await db
      .select({
        total: sql<number>`count(*)::int`,
        new: sql<number>`count(*) filter (where ${vehicleEnquiries.status} = 'new')::int`,
        contacted: sql<number>`count(*) filter (where ${vehicleEnquiries.status} = 'contacted')::int`,
        qualified: sql<number>`count(*) filter (where ${vehicleEnquiries.status} = 'qualified')::int`,
        negotiating: sql<number>`count(*) filter (where ${vehicleEnquiries.status} = 'negotiating')::int`,
        converted: sql<number>`count(*) filter (where ${vehicleEnquiries.status} = 'converted')::int`,
        lost: sql<number>`count(*) filter (where ${vehicleEnquiries.status} = 'lost')::int`,
      })
      .from(vehicleEnquiries)
      .where(and(...conditions));

    const statusBreakdown = await db
      .select({
        status: vehicleEnquiries.status,
        count: sql<number>`count(*)::int`,
      })
      .from(vehicleEnquiries)
      .where(and(...conditions))
      .groupBy(vehicleEnquiries.status);

    const sourceBreakdown = await db
      .select({
        source: vehicleEnquiries.source,
        count: sql<number>`count(*)::int`,
      })
      .from(vehicleEnquiries)
      .where(and(...conditions))
      .groupBy(vehicleEnquiries.source);

    return {
      total: totals?.total ?? 0,
      new: totals?.new ?? 0,
      contacted: totals?.contacted ?? 0,
      qualified: totals?.qualified ?? 0,
      negotiating: totals?.negotiating ?? 0,
      converted: totals?.converted ?? 0,
      lost: totals?.lost ?? 0,
      conversionRate: totals?.total ? Math.round(((totals?.converted ?? 0) / (totals?.total ?? 1)) * 100) : 0,
      statusBreakdown: statusBreakdown.map((r) => ({ status: r.status, count: r.count })),
      sourceBreakdown: sourceBreakdown.map((r) => ({ source: r.source, count: r.count })),
    };
  }

  // ── Top Customers by Revenue ─────────────────────────────────────────────

  async getTopCustomers(dateFrom?: Date, dateTo?: Date) {
    const conditions = [
      sql`${orders.deletedAt} IS NULL`,
      sql`${orders.status} IN ('confirmed', 'processing', 'shipped', 'delivered')`,
      sql`${orders.customerId} IS NOT NULL`,
    ];
    if (dateFrom) conditions.push(sql`${orders.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${orders.createdAt} <= ${dateTo}`);

    const rows = await db
      .select({
        customerId: orders.customerId,
        orderCount: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
      })
      .from(orders)
      .where(and(...conditions))
      .groupBy(orders.customerId)
      .orderBy(desc(sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`))
      .limit(10);

    return rows.map((r) => ({
      customerId: r.customerId,
      orderCount: r.orderCount,
      totalRevenue: r.totalRevenue,
    }));
  }

  // ── WhatsApp Clicks ──────────────────────────────────────────────────────

  async getWhatsAppClickStats(dateFrom?: Date, dateTo?: Date) {
    const conditions = [sql`${whatsappClicks.deletedAt} IS NULL`];
    if (dateFrom) conditions.push(sql`${whatsappClicks.createdAt} >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`${whatsappClicks.createdAt} <= ${dateTo}`);

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(whatsappClicks)
      .where(and(...conditions));

    const bySource = await db
      .select({
        source: whatsappClicks.source,
        count: sql<number>`count(*)::int`,
      })
      .from(whatsappClicks)
      .where(and(...conditions))
      .groupBy(whatsappClicks.source);

    return {
      total: total?.count ?? 0,
      bySource: bySource.map((r) => ({ source: r.source ?? 'unknown', count: r.count })),
    };
  }

  // ── Vehicle Aging (days on lot) ──────────────────────────────────────────

  async getVehicleAging() {
    const rows = await db
      .select({
        id: vehicles.id,
        vin: vehicles.vin,
        stockNumber: vehicles.stockNumber,
        year: vehicles.year,
        status: vehicles.status,
        createdAt: vehicles.createdAt,
        daysOnLot: sql<number>`extract(day from now() - ${vehicles.createdAt})::int`,
      })
      .from(vehicles)
      .where(sql`${vehicles.status} = 'active' AND ${vehicles.deletedAt} IS NULL`)
      .orderBy(desc(sql<number>`extract(day from now() - ${vehicles.createdAt})::int`))
      .limit(10);

    return rows.map((r) => ({
      id: r.id,
      label: r.vin || r.stockNumber || `${r.year ?? ''} Vehicle`.trim(),
      status: r.status,
      createdAt: r.createdAt,
      daysOnLot: r.daysOnLot ?? 0,
    }));
  }

  // ── All-Time Summary (for export) ────────────────────────────────────────

  async getAllTimeSummary() {
    const [vehicleStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${vehicles.status} = 'active')::int`,
        sold: sql<number>`count(*) filter (where ${vehicles.status} = 'sold')::int`,
      })
      .from(vehicles)
      .where(sql`${vehicles.deletedAt} IS NULL`);

    const [orderStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
      })
      .from(orders)
      .where(sql`${orders.deletedAt} IS NULL`);

    const [paymentStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        collected: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.status} = 'completed'), 0)::int`,
      })
      .from(payments)
      .where(sql`${payments.deletedAt} IS NULL`);

    const [customerStats] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers);

    const [leadStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        converted: sql<number>`count(*) filter (where ${vehicleEnquiries.status} = 'converted')::int`,
      })
      .from(vehicleEnquiries)
      .where(sql`${vehicleEnquiries.deletedAt} IS NULL`);

    const [supportStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${supportTickets.status} = 'open')::int`,
      })
      .from(supportTickets)
      .where(sql`${supportTickets.deletedAt} IS NULL`);

    return {
      vehicles: { total: vehicleStats?.total ?? 0, active: vehicleStats?.active ?? 0, sold: vehicleStats?.sold ?? 0 },
      orders: { total: orderStats?.total ?? 0, revenue: orderStats?.revenue ?? 0 },
      payments: { total: paymentStats?.total ?? 0, collected: paymentStats?.collected ?? 0 },
      customers: customerStats?.count ?? 0,
      leads: { total: leadStats?.total ?? 0, converted: leadStats?.converted ?? 0 },
      support: { total: supportStats?.total ?? 0, open: supportStats?.open ?? 0 },
    };
  }
}
