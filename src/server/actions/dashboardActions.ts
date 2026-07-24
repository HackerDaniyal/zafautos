'use server';

import { db } from '@/server/db/client';
import { vehicles, orders, payments, shipments, users, customers, dealers } from '@/server/db/schema';
import { sql, eq, desc, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  soldVehicles: number;
  draftVehicles: number;
  totalCustomers: number;
  totalDealers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  activeShipments: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAuth();

  const [vehicleStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${vehicles.status} = 'active')::int`,
      sold: sql<number>`count(*) filter (where ${vehicles.status} = 'sold')::int`,
      draft: sql<number>`count(*) filter (where ${vehicles.status} = 'draft')::int`,
    })
    .from(vehicles)
    .where(sql`${vehicles.deletedAt} IS NULL`);

  const [customerCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers);

  const [dealerCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dealers);

  const [orderStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
    })
    .from(orders)
    .where(sql`${orders.deletedAt} IS NULL`);

  const [paymentStats] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${payments.status} = 'pending')::int`,
    })
    .from(payments)
    .where(sql`${payments.deletedAt} IS NULL`);

  const [shipmentStats] = await db
    .select({
      active: sql<number>`count(*) filter (where ${payments.status} = 'pending')::int`,
    })
    .from(shipments)
    .where(sql`${shipments.deletedAt} IS NULL AND ${shipments.status} IN ('pending', 'in_transit')`);

  return {
    totalVehicles: vehicleStats?.total ?? 0,
    activeVehicles: vehicleStats?.active ?? 0,
    soldVehicles: vehicleStats?.sold ?? 0,
    draftVehicles: vehicleStats?.draft ?? 0,
    totalCustomers: customerCount?.count ?? 0,
    totalDealers: dealerCount?.count ?? 0,
    totalOrders: orderStats?.total ?? 0,
    totalRevenue: orderStats?.revenue ?? 0,
    pendingPayments: paymentStats?.pending ?? 0,
    activeShipments: shipmentStats?.active ?? 0,
  };
}

export async function getRecentOrders(limit = 5): Promise<RecentOrder[]> {
  await requireAuth();

  const data = await db
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

  return data.map((row) => ({
    ...row,
    status: row.status as string,
  }));
}

export async function getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  await requireAuth();

  const data = await db
    .select({
      month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int`,
      orders: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(sql`${orders.deletedAt} IS NULL AND ${orders.createdAt} >= now() - interval '12 months'`)
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

  return data;
}
