import { requireAuth } from '@/lib/auth';
import { AuthRepository } from '@/server/repositories';
import { profiles } from '@/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { vehicles, orders } from '@/server/db/schema';
import { StatCard } from '@/components/admin/ui/stat-card';
import { SectionHeader } from '@/components/admin/ui/section-header';
import { StatusChip, getStatusVariant } from '@/components/admin/ui/status-chip';
import { formatPrice } from '@/lib/utils';
import {
  Car,
  CreditCard,
  Truck,
  TrendingUp,
  Package,
  ShoppingBag,
} from 'lucide-react';
import type { Metadata } from 'next';
import { DashboardCharts } from './dashboard-charts';

export const metadata: Metadata = {
  title: 'Admin Dashboard | ZafAutos Japan',
};

const authRepo = new AuthRepository();

export default async function AdminDashboardPage() {
  const auth = await requireAuth();

  const [profile] = await authRepo.profiles.getClient()
    .select()
    .from(profiles)
    .where(eq(profiles.userId, auth.userId))
    .limit(1);

  const [vehicleStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${vehicles.status} = 'active')::int`,
      sold: sql<number>`count(*) filter (where ${vehicles.status} = 'sold')::int`,
      draft: sql<number>`count(*) filter (where ${vehicles.status} = 'draft')::int`,
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

  const recentOrders = await db
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
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
          Dashboard
        </h1>
        <p className="text-sm text-ash">
          Welcome back, {profile?.firstName ?? auth.email}. Here&apos;s what&apos;s happening.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          title="Total Vehicles"
          value={vehicleStats?.total ?? 0}
          icon={Car}
          description={`${vehicleStats?.active ?? 0} active`}
        />
        <StatCard
          title="Active Vehicles"
          value={vehicleStats?.active ?? 0}
          icon={TrendingUp}
        />
        <StatCard
          title="Sold Vehicles"
          value={vehicleStats?.sold ?? 0}
          icon={Package}
        />
        <StatCard
          title="Draft Vehicles"
          value={vehicleStats?.draft ?? 0}
          icon={Car}
        />
        <StatCard
          title="Total Orders"
          value={orderStats?.total ?? 0}
          icon={ShoppingBag}
        />
        <StatCard
          title="Revenue"
          value={formatPrice(orderStats?.revenue ?? 0)}
          icon={CreditCard}
        />
        <StatCard
          title="Pending Payments"
          value={0}
          icon={CreditCard}
        />
        <StatCard
          title="Active Shipments"
          value={0}
          icon={Truck}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <DashboardCharts />
        </div>

        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
          <SectionHeader title="Recent Orders" />
          <div className="mt-4 space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-ash py-8 text-center">No orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-[6px] border border-iron/30 p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-pure-white">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-ash">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-pure-white">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <StatusChip
                      label={order.status as string}
                      variant={getStatusVariant(order.status as string)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
