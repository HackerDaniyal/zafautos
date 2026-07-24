'use client';

import { RevenueChart, OrdersChart, VehicleStatusChart } from '@/components/admin/charts/charts';
import { SectionHeader } from '@/components/admin/ui/section-header';
import { Card, CardContent } from '@/components/ui/card';

const mockRevenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Apr', revenue: 61000 },
  { month: 'May', revenue: 55000 },
  { month: 'Jun', revenue: 67000 },
];

const mockOrdersData = [
  { month: 'Jan', orders: 12 },
  { month: 'Feb', orders: 18 },
  { month: 'Mar', orders: 15 },
  { month: 'Apr', orders: 22 },
  { month: 'May', orders: 19 },
  { month: 'Jun', orders: 25 },
];

const mockVehicleStatusData = [
  { name: 'Active', value: 120 },
  { name: 'Draft', value: 35 },
  { name: 'Sold', value: 85 },
  { name: 'Archived', value: 20 },
];

function DashboardCharts() {
  return (
    <>
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <SectionHeader title="Revenue" description="Last 6 months" />
        <div className="mt-4">
          <RevenueChart data={mockRevenueData} />
        </div>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <SectionHeader title="Orders" description="Last 6 months" />
        <div className="mt-4">
          <OrdersChart data={mockOrdersData} />
        </div>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <SectionHeader title="Vehicle Status" />
        <div className="mt-4">
          <VehicleStatusChart data={mockVehicleStatusData} />
        </div>
      </div>
    </>
  );
}

export { DashboardCharts };
