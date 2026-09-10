'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Eye, Pencil, UserCheck, UserX, ShoppingCart } from 'lucide-react';
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
import { formatCurrency } from '@/lib/utils';
import {
  listCustomers,
  bulkDeleteCustomers,
  bulkUpdateCustomerStatus,
  getCustomerStats,
  exportCustomersCsv,
} from '@/server/actions/customerActions';
import { CUSTOMER_STATUS_CONFIG, CUSTOMER_STATUS_OPTIONS, CUSTOMER_DEFAULT_PAGE_SIZE } from './constants';
import type { CustomerWithRelations, CustomerListParams, CustomerStatus } from './types';

export function CustomersClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<CustomerWithRelations[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(CUSTOMER_DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [sortColumn, setSortColumn] = React.useState('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [searchValue, setSearchValue] = React.useState('');
  const [stats, setStats] = React.useState<{
    totalCustomers: number;
    activeCustomers: number;
    pendingCustomers: number;
    suspendedCustomers: number;
    blockedCustomers: number;
    newThisMonth: number;
    returningCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const { filters, setFilter, clearAll } = useFilters();
  const { selected, toggleAll, clearSelection, selectedCount, selectedIds } =
    useBulkSelection<CustomerWithRelations>(data);

  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await getCustomerStats();
      if (result.success && result.data) {
        setStats(result.data as typeof stats);
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

      const params: CustomerListParams = {
        page,
        limit: pageSize,
        sortColumn,
        sortDirection,
        search: searchValue || undefined,
        status: (filters.status as CustomerStatus) || undefined,
        dateFrom: dateRange?.from,
        dateTo: dateRange?.to,
      };
      const result = await listCustomers(params);
      if (result.success) {
        const res = result.data as {
          data: CustomerWithRelations[];
          meta: { total: number; totalPages: number };
        };
        setData(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load customers', variant: 'error' });
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
      const result = await exportCustomersCsv({
        status: (filters.status as CustomerStatus) || undefined,
        search: searchValue || undefined,
      });
      if (result.success) {
        const csvData = result.data as string;
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
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

  const columns: ColumnDef<CustomerWithRelations>[] = React.useMemo(
    () => [
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => {
          const config = CUSTOMER_STATUS_CONFIG[row.status as keyof typeof CUSTOMER_STATUS_CONFIG];
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
        id: 'name',
        header: 'Name',
        cell: (row) => (
          <div className="min-w-[150px]">
            <p className="text-sm font-medium text-pure-white">
              {row.displayName || [row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
            </p>
            <p className="text-xs text-steel">{row.email}</p>
          </div>
        ),
      },
      {
        id: 'phone',
        header: 'Phone',
        cell: (row) => (
          <span className="text-sm text-pure-white">
            {row.phone ?? '—'}
          </span>
        ),
      },
      {
        id: 'orderCount',
        header: 'Orders',
        accessorKey: 'orderCount',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-pure-white">
            {row.orderCount ?? 0}
          </span>
        ),
      },
      {
        id: 'totalSpent',
        header: 'Total Spent',
        accessorKey: 'totalSpent',
        sortable: true,
        cell: (row) => (
          <span className="text-sm font-medium text-pure-white">
            {formatCurrency(row.totalSpent)}
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
              onClick={() => router.push(`/admin/customers/${row.id}`)}
            >
              <Eye className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => router.push(`/admin/customers/${row.id}/edit`)}
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
      { id: 'status', label: 'Status', type: 'select', options: CUSTOMER_STATUS_OPTIONS },
      { id: 'dateRange', label: 'Date Range', type: 'date-range' },
    ],
    [],
  );

  const bulkActions: BulkAction[] = React.useMemo(
    () => [
      {
        label: 'Activate',
        action: async (ids) => {
          const result = await bulkUpdateCustomerStatus(ids, 'active');
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Suspend',
        action: async (ids) => {
          const result = await bulkUpdateCustomerStatus(ids, 'suspended');
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Block',
        action: async (ids) => {
          const result = await bulkUpdateCustomerStatus(ids, 'blocked');
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
          'Are you sure you want to delete selected customers? This action cannot be undone.',
        action: async (ids) => {
          const result = await bulkDeleteCustomers(ids);
          if (result.success) { fetchData(); fetchStats(); } else { throw new Error(result.error); }
        },
      },
    ],
    [fetchData, fetchStats],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer accounts"
        action={{ label: 'New Customer', href: '/admin/customers/new', icon: Plus }}
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
            title="Total Customers"
            value={stats.totalCustomers}
            icon="Users"
            description={`${stats.newThisMonth} new this month`}
          />
          <StatCard
            title="Active"
            value={stats.activeCustomers}
            icon="UserCheck"
            description={`${stats.pendingCustomers} pending`}
          />
          <StatCard
            title="Orders"
            value={stats.totalOrders}
            icon="ShoppingCart"
            description={`${stats.returningCustomers} returning`}
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon="Users"
            description={`${formatCurrency(stats.avgOrderValue)} avg`}
          />
          <StatCard
            title="Suspended"
            value={stats.suspendedCustomers + stats.blockedCustomers}
            icon="UserX"
            description={stats.suspendedCustomers > 0 ? `${stats.suspendedCustomers} suspended` : 'No suspensions'}
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
        searchPlaceholder="Search customers..."
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
        emptyTitle="No customers"
        emptyDescription="Customers will appear here once they register."
        emptyIcon={Users}
        getRowId={(row) => (row as unknown as CustomerWithRelations).id}
        onRowClick={(row) =>
          router.push(`/admin/customers/${(row as unknown as CustomerWithRelations).id}`)
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
