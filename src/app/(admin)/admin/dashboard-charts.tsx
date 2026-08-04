'use client';

import { useState } from 'react';
import { RevenueChart, OrdersChart, VehicleStatusChart } from '@/components/admin/charts/charts';
import { SectionHeader } from '@/components/admin/ui/section-header';

interface DashboardChartsProps {
  revenueData: { month: string; label: string; revenue: number }[];
  ordersData: { month: string; label: string; orders: number }[];
  vehicleStats: { total: number; active: number; sold: number; draft: number; archived: number };
}

const PERIODS = [
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
] as const;

function DashboardCharts({ revenueData, ordersData, vehicleStats }: DashboardChartsProps) {
  const [revenuePeriod, setRevenuePeriod] = useState<6 | 12>(6);
  const [ordersPeriod, setOrdersPeriod] = useState<6 | 12>(6);

  const filteredRevenue = revenueData.slice(-revenuePeriod);
  const filteredOrders = ordersData.slice(-ordersPeriod);

  const chartRevenueData = filteredRevenue.map((d) => ({ month: d.label, revenue: d.revenue }));
  const chartOrdersData = filteredOrders.map((d) => ({ month: d.label, orders: d.orders }));

  const vehicleStatusData = [
    { name: 'Active', value: vehicleStats.active },
    { name: 'Draft', value: vehicleStats.draft },
    { name: 'Sold', value: vehicleStats.sold },
    { name: 'Archived', value: vehicleStats.archived },
  ].filter((d) => d.value > 0);

  return (
    <>
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <SectionHeader
          title="Revenue"
          description="Order revenue over time"
          action={
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p.months}
                  onClick={() => setRevenuePeriod(p.months)}
                  className={`rounded-[4px] px-2 py-1 text-xs font-medium transition-colors ${
                    revenuePeriod === p.months
                      ? 'bg-signal-red/10 text-signal-red'
                      : 'text-steel hover:text-ash'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          }
        />
        <div className="mt-4">
          {chartRevenueData.length > 0 ? (
            <RevenueChart data={chartRevenueData} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-sm text-steel">No revenue data yet</div>
          )}
        </div>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <SectionHeader
          title="Orders"
          description="Orders over time"
          action={
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p.months}
                  onClick={() => setOrdersPeriod(p.months)}
                  className={`rounded-[4px] px-2 py-1 text-xs font-medium transition-colors ${
                    ordersPeriod === p.months
                      ? 'bg-signal-red/10 text-signal-red'
                      : 'text-steel hover:text-ash'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          }
        />
        <div className="mt-4">
          {chartOrdersData.length > 0 ? (
            <OrdersChart data={chartOrdersData} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-sm text-steel">No order data yet</div>
          )}
        </div>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <SectionHeader title="Vehicle Status" />
        <div className="mt-4">
          {vehicleStatusData.length > 0 ? (
            <VehicleStatusChart data={vehicleStatusData} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-sm text-steel">No vehicles yet</div>
          )}
        </div>
      </div>
    </>
  );
}

export { DashboardCharts };
