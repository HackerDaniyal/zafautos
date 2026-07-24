'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Ship, Plus, Eye, Pencil, Truck, Package, MapPin, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/admin/table/data-table';
import { FilterBar, type FilterConfig } from '@/components/admin/filters/filter-bar';
import { useFilters } from '@/components/admin/filters/use-filters';
import { useBulkSelection } from '@/components/admin/bulk/use-bulk-selection';
import { BulkActionBar, type BulkAction } from '@/components/admin/bulk/bulk-action-bar';
import { PageHeader } from '@/components/admin/ui/page-header';
import { StatCard } from '@/components/admin/ui/stat-card';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { formatDate } from '@/lib/cms/dates';
import {
  listShipments,
  deleteShipment,
  bulkDeleteShipments,
  bulkUpdateShipmentStatus,
  getShippingStats,
  exportShipmentsCsv,
} from '@/server/actions/shippingActions';
import { SHIPMENT_STATUS_CONFIG, SHIPMENT_STATUS_OPTIONS, SHIPMENT_DEFAULT_PAGE_SIZE } from './constants';
import type { ShipmentWithRelations, ShippingListParams, ShipmentStatus } from './types';

interface DashboardStats {
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  delayedShipments: number;
  cancelledShipments: number;
}

export function ShippingClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<ShipmentWithRelations[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(SHIPMENT_DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [sortColumn, setSortColumn] = React.useState('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [searchValue, setSearchValue] = React.useState('');
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const { filters, setFilter, clearAll } = useFilters();
  const { selected, toggleAll, clearSelection, selectedCount, selectedIds } =
    useBulkSelection<ShipmentWithRelations>(data);

  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await getShippingStats();
      if (result.success && result.data) {
        const s = result.data as DashboardStats;
        setStats({
          totalShipments: s.totalShipments ?? 0,
          pendingShipments: s.pendingShipments ?? 0,
          inTransitShipments: s.inTransitShipments ?? 0,
          deliveredShipments: s.deliveredShipments ?? 0,
          delayedShipments: s.delayedShipments ?? 0,
          cancelledShipments: s.cancelledShipments ?? 0,
        });
      }
    } catch {
      // Stats are non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const dateRange = filters.dateRange as { from?: string; to?: string } | undefined;

      const params: ShippingListParams = {
        page,
        limit: pageSize,
        sortColumn,
        sortDirection,
        search: searchValue || undefined,
        status: (filters.status as ShipmentStatus) || undefined,
        carrier: (filters.carrier as string) || undefined,
        dateFrom: dateRange?.from,
        dateTo: dateRange?.to,
      };
      const result = await listShipments(params);
      if (result.success) {
        const res = result.data as {
          data: ShipmentWithRelations[];
          meta: { total: number; totalPages: number };
        };
        setData(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load shipments', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortColumn, sortDirection, searchValue, filters, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  function handleSelectionChange(newSelected: Set<string>) {
    toggleAll(data.filter((row) => newSelected.has(row.id)));
  }

  async function handleExportCsv() {
    try {
      const result = await exportShipmentsCsv({
        status: (filters.status as ShipmentStatus) || undefined,
        carrier: (filters.carrier as string) || undefined,
        search: searchValue || undefined,
      });
      if (result.success) {
        const csvData = result.data as string;
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shipments-export-${new Date().toISOString().split('T')[0]}.csv`;
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

  const columns: ColumnDef<ShipmentWithRelations>[] = React.useMemo(
    () => [
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => {
          const config = SHIPMENT_STATUS_CONFIG[row.status as keyof typeof SHIPMENT_STATUS_CONFIG];
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
        id: 'orderNumber',
        header: 'Order #',
        cell: (row) => (
          <span className="font-mono text-xs text-pure-white">
            {row.orderNumber ?? '—'}
          </span>
        ),
      },
      {
        id: 'carrier',
        header: 'Carrier',
        accessorKey: 'carrier',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-pure-white">
            {row.carrier ?? '—'}
          </span>
        ),
      },
      {
        id: 'containers',
        header: 'Containers',
        cell: (row) => (
          <span className="text-sm text-pure-white">
            {row.containerCount ?? 0}
          </span>
        ),
      },
      {
        id: 'trackingEvents',
        header: 'Tracking',
        cell: (row) => (
          <span className="text-sm text-pure-white">
            {row.trackingCount ?? 0}
          </span>
        ),
      },
      {
        id: 'createdAt',
        header: 'Created',
        accessorKey: 'createdAt',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-steel">
            {formatDate(row.createdAt)}
          </span>
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
              onClick={() => router.push(`/admin/shipping/${row.id}`)}
            >
              <Eye className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => router.push(`/admin/shipping/${row.id}/edit`)}
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
      { id: 'status', label: 'Status', type: 'select', options: SHIPMENT_STATUS_OPTIONS },
      { id: 'carrier', label: 'Carrier', type: 'text', placeholder: 'Search by carrier...' },
      { id: 'dateRange', label: 'Date Range', type: 'date-range' },
    ],
    [],
  );

  const bulkActions: BulkAction[] = React.useMemo(
    () => [
      {
        label: 'Mark In Transit',
        action: async (ids) => {
          const result = await bulkUpdateShipmentStatus(ids, 'in_transit');
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Mark Delivered',
        action: async (ids) => {
          const result = await bulkUpdateShipmentStatus(ids, 'delivered');
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Mark Delayed',
        action: async (ids) => {
          const result = await bulkUpdateShipmentStatus(ids, 'delayed');
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Cancel',
        action: async (ids) => {
          const result = await bulkUpdateShipmentStatus(ids, 'cancelled');
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
          'Are you sure you want to delete selected shipments? This action cannot be undone.',
        action: async (ids) => {
          const result = await bulkDeleteShipments(ids);
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
    ],
    [fetchData, fetchStats],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipping"
        description="Manage shipments and tracking"
        action={{ label: 'New Shipment', href: '/admin/shipping/new', icon: Plus }}
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
            title="Total Shipments"
            value={stats.totalShipments}
            icon={Ship}
            description={`${stats.pendingShipments} pending`}
          />
          <StatCard
            title="In Transit"
            value={stats.inTransitShipments}
            icon={Truck}
            description={`${stats.deliveredShipments} delivered`}
          />
          <StatCard
            title="Delivered"
            value={stats.deliveredShipments}
            icon={Package}
            description={stats.deliveredShipments > 0 ? `${Math.round((stats.deliveredShipments / stats.totalShipments) * 100)}% rate` : 'No deliveries'}
          />
          <StatCard
            title="Delayed"
            value={stats.delayedShipments}
            icon={MapPin}
            description={stats.delayedShipments > 0 ? `${Math.round((stats.delayedShipments / stats.totalShipments) * 100)}% rate` : 'No delays'}
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelledShipments}
            icon={Ship}
            description={stats.cancelledShipments > 0 ? `${Math.round((stats.cancelledShipments / stats.totalShipments) * 100)}% rate` : 'No cancellations'}
          />
        </div>
      ) : null}

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
        searchPlaceholder="Search shipments..."
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
        emptyTitle="No shipments"
        emptyDescription="Shipments will appear here once you create your first shipment."
        emptyIcon={Ship}
        getRowId={(row) => (row as unknown as ShipmentWithRelations).id}
        onRowClick={(row) =>
          router.push(`/admin/shipping/${(row as unknown as ShipmentWithRelations).id}`)
        }
      />

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
