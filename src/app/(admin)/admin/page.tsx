import { requireAuth } from '@/lib/auth';
import { StatCard } from '@/components/admin/ui/stat-card';
import type { Metadata } from 'next';
import { getDashboardStats } from '@/server/actions/dashboardStatsActions';
import { SectionHeader } from '@/components/admin/ui/section-header';
import { StatusChip, getStatusVariant } from '@/components/admin/ui/status-chip';
import { formatPrice } from '@/lib/utils';
import { getProfileByUserId } from '@/server/actions/authActions';
import { DashboardCharts } from './dashboard-charts';
import { DashboardActivity } from './dashboard-activity';
import { DashboardAlerts } from './dashboard-alerts';
import { DashboardQuickActions } from './dashboard-quick-actions';

export const metadata: Metadata = {
  title: 'Admin Dashboard | ZafAutos Japan',
};

export default async function AdminDashboardPage() {
  const auth = await requireAuth();

  const profileResult = await getProfileByUserId(auth.userId);
  const profile = profileResult.success ? profileResult.data : null;

  const dashboardResult = await getDashboardStats();
  const dashboard = dashboardResult.success ? dashboardResult.data as {
    vehicleStats: { total: number; active: number; sold: number; draft: number; archived: number };
    orderStats: { total: number; revenue: number };
    paymentStats: { pendingCount: number; failedCount: number };
    shipmentStats: { total: number; inTransit: number; delayed: number };
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      status: string;
      totalAmount: number;
      createdAt: Date;
    }>;
    revenueByMonth: Array<{ month: string; label: string; revenue: number }>;
    ordersByMonth: Array<{ month: string; label: string; orders: number }>;
    recentActivity: Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      entityLabel: string | null;
      userId: string | null;
      createdAt: Date;
    }>;
    alerts: { draftVehicles: number; delayedShipments: number; pendingPayments: number; failedPayments: number };
  } : null;

  const vehicleStats = dashboard?.vehicleStats ?? { total: 0, active: 0, sold: 0, draft: 0, archived: 0 };
  const orderStats = dashboard?.orderStats ?? { total: 0, revenue: 0 };
  const paymentStats = dashboard?.paymentStats ?? { pendingCount: 0, failedCount: 0 };
  const shipmentStats = dashboard?.shipmentStats ?? { total: 0, inTransit: 0, delayed: 0 };

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

      <DashboardQuickActions />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          title="Total Vehicles"
          value={vehicleStats.total}
          icon="Car"
          description={`${vehicleStats.active} active`}
        />
        <StatCard
          title="Active Vehicles"
          value={vehicleStats.active}
          icon="TrendingUp"
        />
        <StatCard
          title="Sold Vehicles"
          value={vehicleStats.sold}
          icon="Package"
        />
        <StatCard
          title="Total Orders"
          value={orderStats.total}
          icon="ShoppingBag"
        />
        <StatCard
          title="Revenue"
          value={formatPrice(orderStats.revenue)}
          icon="CreditCard"
        />
        <StatCard
          title="Pending Payments"
          value={paymentStats.pendingCount}
          icon="DollarSign"
          description={paymentStats.failedCount > 0 ? `${paymentStats.failedCount} failed` : undefined}
        />
        <StatCard
          title="Active Shipments"
          value={shipmentStats.inTransit}
          icon="Truck"
          description={shipmentStats.delayed > 0 ? `${shipmentStats.delayed} delayed` : undefined}
        />
        <StatCard
          title="Draft Vehicles"
          value={vehicleStats.draft}
          icon="FileText"
        />
      </div>

      <DashboardAlerts alerts={dashboard?.alerts ?? null} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <DashboardCharts
            revenueData={dashboard?.revenueByMonth ?? []}
            ordersData={dashboard?.ordersByMonth ?? []}
            vehicleStats={vehicleStats}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
            <SectionHeader title="Recent Orders" />
            <div className="mt-4 space-y-3">
              {(!dashboard?.recentOrders || dashboard.recentOrders.length === 0) ? (
                <p className="text-sm text-ash py-8 text-center">No orders yet.</p>
              ) : (
                dashboard.recentOrders.map((order) => (
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
                        label={order.status}
                        variant={getStatusVariant(order.status)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DashboardActivity activities={dashboard?.recentActivity ?? []} />
        </div>
      </div>
    </div>
  );
}
