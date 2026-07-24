'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Plus, Eye, Pencil, ShoppingBag, DollarSign,
  Clock, Truck, XCircle, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/admin/table/data-table';
import { FilterBar, type FilterConfig } from '@/components/admin/filters/filter-bar';
import { useFilters } from '@/components/admin/filters/use-filters';
import { useBulkSelection } from '@/components/admin/bulk/use-bulk-selection';
import { BulkActionBar, type BulkAction } from '@/components/admin/bulk/bulk-action-bar';
import { PageHeader } from '@/components/admin/ui/page-header';
import { StatCard } from '@/components/admin/ui/stat-card';
import { SectionHeader } from '@/components/admin/ui/section-header';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import {
  listOrdersForAdmin,
  changeOrderStatus,
  bulkDeleteOrders,
  bulkUpdateOrderStatus,
  getOrderStats,
  bulkRestoreOrders,
  exportOrdersCsv,
} from '@/server/actions/orderActions';
import { getRecentActivityAction } from '@/server/actions/auditActions';
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  SHIPPING_STATUS_OPTIONS,
  ORDER_DEFAULT_PAGE_SIZE,
} from './constants';
import type { Order, OrderListParams, OrderStatus } from './types';

interface OrderRow extends Order {
  customerName?: string;
  customerEmail?: string;
  dealerName?: string;
  dealerEmail?: string;
  vehicleTitle?: string;
  vehicleVin?: string;
  vehicleStockNumber?: string;
  vehicleImageUrl?: string;
  paymentStatus?: string;
  shippingStatus?: string;
}

interface DashboardStats {
  totalOrders: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  avgOrderValue: number;
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel?: string | null;
  createdAt: Date | string;
}

export function OrdersClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<OrderRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(ORDER_DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [sortColumn, setSortColumn] = React.useState('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [searchValue, setSearchValue] = React.useState('');
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [recentActivity, setRecentActivity] = React.useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = React.useState(true);
  const { filters, setFilter, clearAll } = useFilters();
  const { selected, toggleAll, clearSelection, selectedCount, selectedIds } =
    useBulkSelection<OrderRow>(data);

  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await getOrderStats();
      if (result.success && result.data) {
        const s = result.data as {
          totalOrders: number;
          totalRevenue: number;
          byStatus: Array<{ status: string; count: number }>;
        };
        const statusMap: Record<string, number> = {};
        for (const row of s.byStatus ?? []) {
          statusMap[row.status] = row.count;
        }
        setStats({
          totalOrders: s.totalOrders ?? 0,
          pending: statusMap['pending'] ?? 0,
          confirmed: statusMap['confirmed'] ?? 0,
          processing: statusMap['processing'] ?? 0,
          shipped: statusMap['shipped'] ?? 0,
          delivered: statusMap['delivered'] ?? 0,
          cancelled: statusMap['cancelled'] ?? 0,
          totalRevenue: s.totalRevenue ?? 0,
          avgOrderValue: s.totalOrders > 0
            ? Math.round((s.totalRevenue ?? 0) / s.totalOrders)
            : 0,
        });
      }
    } catch {
      // Stats are non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchActivity = React.useCallback(async () => {
    setActivityLoading(true);
    try {
      const result = await getRecentActivityAction(10);
      if (Array.isArray(result)) {
        const orderActivity = (result as unknown as ActivityItem[]).filter(
          (r) => r.entityType === 'order'
        );
        setRecentActivity(orderActivity.slice(0, 5));
      }
    } catch {
      // Activity is non-critical
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const dateRange = filters.dateRange as { from?: string; to?: string } | undefined;

      const params: OrderListParams = {
        page,
        limit: pageSize,
        sortColumn,
        sortDirection,
        search: searchValue || undefined,
        status: (filters.status as OrderStatus) || undefined,
        paymentStatus: (filters.paymentStatus as string) || undefined,
        shippingStatus: (filters.shippingStatus as string) || undefined,
        dateFrom: dateRange?.from,
        dateTo: dateRange?.to,
      };
      const result = await listOrdersForAdmin(params);
      if (result.success) {
        const res = result.data as {
          data: OrderRow[];
          meta: { total: number; totalPages: number };
        };
        setData(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load orders', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortColumn, sortDirection, searchValue, filters, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    fetchStats();
    fetchActivity();
  }, [fetchStats, fetchActivity]);

  function handleSelectionChange(newSelected: Set<string>) {
    toggleAll(data.filter((row) => newSelected.has(row.id)));
  }

  function formatCurrency(amount: number | null | undefined): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  async function handleExportCsv() {
    try {
      const result = await exportOrdersCsv({
        status: (filters.status as OrderStatus) || undefined,
        paymentStatus: (filters.paymentStatus as string) || undefined,
        shippingStatus: (filters.shippingStatus as string) || undefined,
        search: searchValue || undefined,
      });
      if (result.success) {
        const csvData = result.data as string;
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Export complete', variant: 'success' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to export', variant: 'error' });
    }
  }

  const columns: ColumnDef<OrderRow>[] = React.useMemo(
    () => [
      {
        id: 'orderNumber',
        header: 'Order #',
        accessorKey: 'orderNumber',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-xs text-pure-white">
            {row.orderNumber ?? '—'}
          </span>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: (row) => (
          <div className="min-w-[150px]">
            <p className="text-sm font-medium text-pure-white">
              {row.customerName ?? '—'}
            </p>
            {row.customerEmail && (
              <p className="text-xs text-steel">{row.customerEmail}</p>
            )}
          </div>
        ),
      },
      {
        id: 'dealer',
        header: 'Dealer',
        cell: (row) => (
          <span className="text-sm text-pure-white">
            {row.dealerName ?? '—'}
          </span>
        ),
      },
      {
        id: 'vehicle',
        header: 'Vehicle',
        cell: (row) => (
          <div className="min-w-[180px]">
            <p className="text-sm font-medium text-pure-white">
              {row.vehicleTitle ?? '—'}
            </p>
            {row.vehicleVin && (
              <p className="text-xs text-steel font-mono">{row.vehicleVin}</p>
            )}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => {
          const config = ORDER_STATUS_CONFIG[row.status as keyof typeof ORDER_STATUS_CONFIG];
          return config ? (
            <Badge
              variant="outline"
              className={`${config.bgColor} ${config.color} border-transparent`}
            >
              <span className={`mr-1.5 size-1.5 rounded-full ${config.dotColor}`} />
              {config.label}
            </Badge>
          ) : (
            <span className="text-steel">—</span>
          );
        },
      },
      {
        id: 'totalAmount',
        header: 'Total',
        accessorKey: 'totalAmount',
        sortable: true,
        cell: (row) => (
          <span className="text-sm font-medium text-pure-white">
            {formatCurrency(row.totalAmount)}
          </span>
        ),
      },
      {
        id: 'createdAt',
        header: 'Created',
        accessorKey: 'createdAt',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-steel">{formatDate(row.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => router.push(`/admin/orders/${row.id}`)}
            >
              <Eye className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => router.push(`/admin/orders/${row.id}/edit`)}
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  const filterConfigs: FilterConfig[] = React.useMemo(
    () => [
      { id: 'status', label: 'Status', type: 'select', options: ORDER_STATUS_OPTIONS },
      { id: 'paymentStatus', label: 'Payment', type: 'select', options: PAYMENT_STATUS_OPTIONS },
      { id: 'shippingStatus', label: 'Shipping', type: 'select', options: SHIPPING_STATUS_OPTIONS },
      { id: 'dateRange', label: 'Date Range', type: 'date-range' },
    ],
    [],
  );

  const bulkActions: BulkAction[] = React.useMemo(
    () => [
      {
        label: 'Confirm',
        action: async (ids) => {
          const result = await bulkUpdateOrderStatus(ids, 'confirmed');
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Mark Processing',
        action: async (ids) => {
          const result = await bulkUpdateOrderStatus(ids, 'processing');
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Mark Shipped',
        action: async (ids) => {
          const result = await bulkUpdateOrderStatus(ids, 'shipped');
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Mark Delivered',
        action: async (ids) => {
          const result = await bulkUpdateOrderStatus(ids, 'delivered');
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Cancel',
        action: async (ids) => {
          const result = await bulkUpdateOrderStatus(ids, 'cancelled');
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Restore',
        action: async (ids) => {
          const result = await bulkRestoreOrders(ids);
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Export CSV',
        action: async () => {
          await handleExportCsv();
        },
      },
      {
        label: 'Delete',
        variant: 'destructive',
        confirmMessage:
          'Are you sure you want to delete selected orders? This action cannot be undone.',
        action: async (ids) => {
          const result = await bulkDeleteOrders(ids);
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
    ],
    [fetchData, fetchStats],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Manage customer orders and track fulfillment"
        action={{ label: 'New Order', href: '/admin/orders/new', icon: Plus }}
      />

      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[10px]" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingBag}
            description={`${stats.pending} pending`}
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            description={`${formatCurrency(stats.avgOrderValue)} avg`}
          />
          <StatCard
            title="Processing"
            value={stats.processing + stats.confirmed}
            icon={Clock}
            description={`${stats.confirmed} confirmed, ${stats.processing} in progress`}
          />
          <StatCard
            title="Shipped"
            value={stats.shipped}
            icon={Truck}
            description={`${stats.delivered} delivered`}
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
            description={stats.cancelled > 0 ? `${Math.round((stats.cancelled / stats.totalOrders) * 100)}% rate` : 'No cancellations'}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <FilterBar
            filters={filterConfigs}
            values={filters}
            onChange={(id, value) => setFilter(id, value)}
            onClear={clearAll}
          />

          <DataTable
            columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
            data={data as unknown as Record<string, unknown>[]}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            loading={loading}
            searchPlaceholder="Search by order number..."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            onSortChange={(col, dir) => {
              setSortColumn(col);
              setSortDirection(dir);
            }}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            selectedRows={selected}
            onSelectionChange={handleSelectionChange}
            emptyTitle="No orders"
            emptyDescription="Orders will appear here once customers start purchasing."
            emptyIcon={Package}
            getRowId={(row) => (row as unknown as OrderRow).id}
            onRowClick={(row) =>
              router.push(`/admin/orders/${(row as unknown as OrderRow).id}`)
            }
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
            <SectionHeader title="Recent Activity" />
            <div className="mt-4 space-y-3">
              {activityLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-[6px]" />
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-ash py-4 text-center">No recent order activity.</p>
              ) : (
                recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[6px] border border-iron/30 bg-deep-carbon p-3"
                  >
                    <p className="text-sm text-pure-white truncate">{item.action}</p>
                    <p className="text-xs text-steel">
                      {item.entityLabel ?? item.entityId.slice(0, 8)} · {formatDate(item.createdAt as string | Date)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
            <SectionHeader title="Quick Actions" />
            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push('/admin/orders/new')}
              >
                <Plus className="mr-2 size-4" />
                New Order
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportCsv}
              >
                <Download className="mr-2 size-4" />
                Export Orders CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {selectedCount > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          actions={bulkActions}
          onClearSelection={clearSelection}
        />
      )}
    </div>
  );
}
