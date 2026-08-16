'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Car, Users, TrendingUp, DollarSign, ShoppingBag, Truck,
  FileText, Search, Eye, Loader2, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/admin/ui/stat-card';
import { SectionHeader } from '@/components/admin/ui/section-header';
import { cn } from '@/lib/utils';
import { getAnalyticsDashboard } from '@/server/actions/analyticsActions';
import {
  RevenueChart,
  OrdersChart,
  VehicleStatusChart,
} from '@/components/admin/charts/charts';

// ── Types ─────────────────────────────────────────────────────────────────

interface AnalyticsData {
  vehicleStats: { total: number; active: number; sold: number; draft: number; archived: number };
  userStats: { users: number; customers: number; dealers: number };
  pendingRevenue: { total: number; count: number };
  revenue: { revenue: number; orderCount: number };
  revenueByMonth: Array<{ month: string; label: string; revenue: number }>;
  ordersByMonth: Array<{ month: string; label: string; orders: number }>;
  orderStatusBreakdown: Array<{ status: string; count: number }>;
  shipmentStatusBreakdown: Array<{ status: string; count: number }>;
  paymentStatusBreakdown: Array<{ status: string; count: number; total: number }>;
  paymentMethodBreakdown: Array<{ method: string; count: number; total: number }>;
  invoiceStats: {
    total: number; draft: number; sent: number; paid: number;
    overdue: number; cancelled: number; totalAmount: number; balanceDue: number;
  };
  pageViewStats: { total: number; topPaths: Array<{ path: string; count: number }> };
  vehicleViewStats: { total: number; topVehicles: Array<{ vehicleId: string; count: number }> };
  searchStats: { total: number; topSearches: Array<{ query: string; count: number }> };
}

type Tab = 'operational' | 'financial';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-auction-amber/10 text-auction-amber',
  confirmed: 'bg-blue-500/10 text-blue-400',
  processing: 'bg-purple-500/10 text-purple-400',
  shipped: 'bg-cyan-500/10 text-cyan-400',
  delivered: 'bg-available-green/10 text-available-green',
  cancelled: 'bg-steel/10 text-steel',
  active: 'bg-available-green/10 text-available-green',
  draft: 'bg-steel/10 text-steel',
  sold: 'bg-signal-red/10 text-signal-red',
  archived: 'bg-iron/30 text-steel',
  in_transit: 'bg-blue-500/10 text-blue-400',
  delayed: 'bg-auction-amber/10 text-auction-amber',
  paid: 'bg-available-green/10 text-available-green',
  failed: 'bg-destructive/10 text-destructive',
  refunded: 'bg-purple-500/10 text-purple-400',
  sent: 'bg-cyan-500/10 text-cyan-400',
  overdue: 'bg-auction-amber/10 text-auction-amber',
  draft_inv: 'bg-steel/10 text-steel',
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
  }).format(cents / 100);
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-medium', STATUS_COLORS[status] ?? 'bg-iron/10 text-steel')}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function PieChartFromBreakdown({ data, label }: { data: Array<{ name: string; value: number }>; label: string }) {
  return (
    <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
      <SectionHeader title={label} />
      <div className="mt-4">
        {data.length === 0 || data.every((d) => d.value === 0) ? (
          <p className="text-sm text-ash text-center py-8">No data for this period.</p>
        ) : (
          <VehicleStatusChart data={data} />
        )}
      </div>
    </div>
  );
}

function TopList({ items, label }: { items: Array<{ name: string; count: number }>; label: string }) {
  return (
    <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
      <SectionHeader title={label} />
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-ash text-center py-8">No data for this period.</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-[6px] border border-iron/20 px-3 py-2">
              <span className="text-sm text-pure-white truncate max-w-[70%]">{item.name}</span>
              <span className="text-sm font-medium text-ash">{item.count.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FinancialTable({ rows, columns }: { rows: Record<string, unknown>[]; columns: { key: string; label: string; format?: (v: unknown) => React.ReactNode }[] }) {
  return (
    <div className="rounded-[10px] border border-iron/30 bg-carbon overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-iron/30 text-left text-xs text-steel uppercase tracking-wider">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-steel">
                No data for this period.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-b border-iron/20">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.format ? col.format(row[col.key]) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('operational');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAnalyticsDashboard(
        dateFrom || undefined,
        dateTo || undefined,
      );
      if (result.success) {
        setData(result.data as AnalyticsData);
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to load analytics' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load analytics' });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function handleClearDates() {
    setDateFrom('');
    setDateTo('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-steel" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Failed to load analytics data.</p>
      </div>
    );
  }

  const avgOrderValue = data.revenue.orderCount > 0
    ? Math.round(data.revenue.revenue / data.revenue.orderCount)
    : 0;

  const vehicleStatusData = [
    { name: 'Active', value: data.vehicleStats.active },
    { name: 'Sold', value: data.vehicleStats.sold },
    { name: 'Draft', value: data.vehicleStats.draft },
    { name: 'Archived', value: data.vehicleStats.archived },
  ];

  const orderStatusData = data.orderStatusBreakdown.map((r) => ({
    name: r.status.replace(/_/g, ' '), value: r.count,
  }));

  const shipmentStatusData = data.shipmentStatusBreakdown.map((r) => ({
    name: r.status.replace(/_/g, ' '), value: r.count,
  }));

  const paymentMethodData = data.paymentMethodBreakdown.map((r) => ({
    name: r.method, value: r.count,
  }));

  return (
    <>
      {feedback && (
        <div className="rounded-[6px] px-4 py-2 text-sm bg-destructive/10 text-destructive">
          {feedback.message}
        </div>
      )}

      {/* Date Range Filter */}
      <div className="flex flex-wrap items-end gap-3 rounded-[10px] border border-iron/30 bg-carbon p-4">
        <div className="space-y-1">
          <label className="text-xs text-steel">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white focus-visible:border-signal-red outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-steel">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white focus-visible:border-signal-red outline-none"
          />
        </div>
        {(dateFrom || dateTo) && (
          <Button variant="outline" size="sm" onClick={handleClearDates}>Clear</Button>
        )}
        <div className="ml-auto text-xs text-steel">
          {dateFrom || dateTo ? 'Showing filtered data' : 'Showing all-time data'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-[10px] border border-iron/30 bg-carbon p-1">
        {(['operational', 'financial'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-[6px] px-4 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'bg-signal-red text-pure-white'
                : 'text-ash hover:text-pure-white hover:bg-white/[0.05]'
            )}
          >
            {t === 'operational' ? 'Operational' : 'Financial'}
          </button>
        ))}
      </div>

      {/* Operational Tab */}
      {tab === 'operational' && (
        <div className="space-y-6">
          {/* Snapshot Stats (current state) */}
          <div>
            <p className="text-xs text-steel uppercase mb-3">Current Snapshot</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Vehicles" value={data.vehicleStats.total} icon="Car" description={`${data.vehicleStats.active} active`} />
              <StatCard title="Total Users" value={data.userStats.users} icon="Users" description={`${data.userStats.customers} customers, ${data.userStats.dealers} dealers`} />
              <StatCard title="Active Shipments" value={data.shipmentStatusBreakdown.find((s) => s.status === 'in_transit')?.count ?? 0} icon="Truck" />
              <StatCard title="Pending Revenue" value={formatPrice(data.pendingRevenue.total)} icon="DollarSign" description={`${data.pendingRevenue.count} pending orders`} />
            </div>
          </div>

          {/* Vehicle Status */}
          <PieChartFromBreakdown data={vehicleStatusData} label="Vehicle Inventory by Status" />

          {/* Order Pipeline (date-filtered) */}
          <div>
            <p className="text-xs text-steel uppercase mb-3">
              Period Metrics {dateFrom || dateTo ? '(filtered)' : '(all-time)'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard title="Total Orders" value={data.revenue.orderCount + data.orderStatusBreakdown.filter((s) => s.status === 'cancelled').reduce((a, b) => a + b.count, 0)} icon="ShoppingBag" />
              <StatCard title="Page Views" value={data.pageViewStats.total} icon="Eye" />
              <StatCard title="Searches" value={data.searchStats.total} icon="Search" />
            </div>
          </div>

          <OrdersChart data={data.ordersByMonth} />

          <div className="grid gap-6 lg:grid-cols-2">
            <PieChartFromBreakdown data={orderStatusData} label="Orders by Status" />
            <PieChartFromBreakdown data={shipmentStatusData} label="Shipments by Status" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TopList
              items={data.pageViewStats.topPaths.map((p) => ({ name: p.path, count: p.count }))}
              label="Top Pages by Views"
            />
            <TopList
              items={data.searchStats.topSearches.map((s) => ({ name: s.query, count: s.count }))}
              label="Top Search Queries"
            />
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {tab === 'financial' && (
        <div className="space-y-6">
          {/* Financial Summary */}
          <div>
            <p className="text-xs text-steel uppercase mb-3">Revenue (Period)</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Revenue" value={formatPrice(data.revenue.revenue)} icon="CreditCard" description={`${data.revenue.orderCount} orders counted`} />
              <StatCard title="Avg Order Value" value={formatPrice(avgOrderValue)} icon="BarChart3" />
              <StatCard title="Pending Payments" value={data.paymentStatusBreakdown.find((s) => s.status === 'pending')?.count ?? 0} icon="DollarSign" description={formatPrice(data.paymentStatusBreakdown.find((s) => s.status === 'pending')?.total ?? 0)} />
              <StatCard title="Failed Payments" value={data.paymentStatusBreakdown.find((s) => s.status === 'failed')?.count ?? 0} icon="FileText" />
            </div>
          </div>

          {/* Invoice Summary (snapshot) */}
          <div>
            <p className="text-xs text-steel uppercase mb-3">Invoices (Current State)</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Invoices" value={data.invoiceStats.total} icon="FileText" />
              <StatCard title="Total Invoiced" value={formatPrice(data.invoiceStats.totalAmount)} icon="CreditCard" />
              <StatCard title="Balance Due" value={formatPrice(data.invoiceStats.balanceDue)} icon="DollarSign" description={`${data.invoiceStats.overdue} overdue`} />
              <StatCard title="Paid Invoices" value={data.invoiceStats.paid} icon="TrendingUp" />
            </div>
          </div>

          <RevenueChart data={data.revenueByMonth} />

          <div className="grid gap-6 lg:grid-cols-2">
            <PieChartFromBreakdown data={paymentMethodData} label="Payments by Method" />
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
              <SectionHeader title="Payment Status" />
              <div className="mt-4">
                <FinancialTable
                  rows={data.paymentStatusBreakdown.map((r) => ({
                    status: r.status,
                    count: r.count,
                    total: r.total,
                  }))}
                  columns={[
                    { key: 'status', label: 'Status', format: (v) => <StatusBadge status={String(v)} /> },
                    { key: 'count', label: 'Count' },
                    { key: 'total', label: 'Amount', format: (v) => formatPrice(Number(v)) },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
            <SectionHeader title="Invoice Status" />
            <div className="mt-4">
              <FinancialTable
                rows={[
                  { status: 'Draft', count: data.invoiceStats.draft, total: 0 },
                  { status: 'Sent', count: data.invoiceStats.sent, total: 0 },
                  { status: 'Paid', count: data.invoiceStats.paid, total: 0 },
                  { status: 'Overdue', count: data.invoiceStats.overdue, total: 0 },
                  { status: 'Cancelled', count: data.invoiceStats.cancelled, total: 0 },
                ]}
                columns={[
                  { key: 'status', label: 'Status' },
                  { key: 'count', label: 'Count' },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
