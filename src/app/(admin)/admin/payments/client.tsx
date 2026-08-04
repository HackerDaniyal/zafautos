'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  DollarSign,
  CreditCard,
  AlertCircle,
  Package,
  Search,
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
import { StatusChip, getStatusVariant } from '@/components/admin/ui/status-chip';
import { useToast } from '@/components/admin/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import {
  listPayments,
  getPaymentStats,
  bulkUpdatePaymentStatus,
  bulkDeletePayments,
} from '@/server/actions/paymentActions';
import {
  PAYMENT_STATUS_CONFIG,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  CURRENCY_OPTIONS,
  PAYMENT_TABS,
} from './constants';
import type { Payment, PaymentStats, PaymentListParams } from './types';

interface PaymentRow extends Payment {
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  dealerName?: string;
  vehicleTitle?: string;
  vehicleVin?: string;
  vehicleStockNumber?: string;
  paymentMethodLabel?: string;
  transactionCount?: number;
  totalInvoices?: number;
}

export function PaymentsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<PaymentRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<PaymentStats | null>(null);
  const [sortColumn, setSortColumn] = React.useState('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [searchValue, setSearchValue] = React.useState('');
  const { filters, setFilter, clearAll } = useFilters();
  const { selected, toggleAll, clearSelection, selectedCount, selectedIds } =
    useBulkSelection<PaymentRow>(data);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const dateRange = filters.dateRange as { from?: string; to?: string } | undefined;

      const params: PaymentListParams = {
        page,
        limit: pageSize,
        sortColumn,
        sortDirection,
        search: searchValue || undefined,
        status: (filters.status as PaymentListParams['status']) || undefined,
        orderId: filters.orderId as string || undefined,
        currency: filters.currency as string || undefined,
        dateFrom: dateRange?.from,
        dateTo: dateRange?.to,
      };

      const [paymentsResult, statsResult] = await Promise.all([
        listPayments(params),
        getPaymentStats(),
      ]);

      if (paymentsResult.success && paymentsResult.data) {
        const res = paymentsResult.data as { data: typeof data; meta: { total: number; totalPages: number } };
        setData(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else if (!paymentsResult.success) {
        toast({ title: 'Error', description: paymentsResult.error, variant: 'error' });
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data as PaymentStats);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load payments', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortColumn, sortDirection, searchValue, filters, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSelectionChange(newSelected: Set<string>) {
    toggleAll(data.filter((row) => newSelected.has(row.id)));
  }

  function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const columns: ColumnDef<PaymentRow>[] = React.useMemo(
    () => [
      {
        id: 'paymentId',
        header: 'ID',
        accessorKey: 'id',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-xs text-pure-white">
            {row.id.slice(0, 8)}...
          </span>
        ),
      },
      {
        id: 'orderNumber',
        header: 'Order #',
        accessorKey: 'orderNumber',
        sortable: true,
        searchable: true,
        cell: (row) => (
          <span className="font-mono text-xs text-pure-white">
            {row.orderNumber ?? '—'}
          </span>
        ),
      },
      {
        id: 'amount',
        header: 'Amount',
        accessorKey: 'amount',
        sortable: true,
        cell: (row) => (
          <span className="text-sm font-medium text-pure-white">
            {formatCurrency(row.amount)}
          </span>
        ),
      },
      {
        id: 'currency',
        header: 'Currency',
        accessorKey: 'currency',
        sortable: true,
        cell: (row) => (
          <Badge variant="outline" className="text-xs">
            {row.currency}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => {
          const config = PAYMENT_STATUS_CONFIG[row.status as keyof typeof PAYMENT_STATUS_CONFIG];
          return config ? (
            <StatusChip
              label={config.label}
              variant={getStatusVariant(row.status)}
            />
          ) : (
            <span className="text-steel">—</span>
          );
        },
      },
      {
        id: 'paymentMethod',
        header: 'Method',
        accessorKey: 'paymentMethod',
        sortable: true,
        cell: (row) => {
          const method = PAYMENT_METHOD_OPTIONS.find((m) => m.value === row.paymentMethod);
          return method ? (
            <span className="text-sm text-steel">{method.label}</span>
          ) : '—';
        },
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: (row) => {
          return (
            <div className="min-w-[150px]">
              <p className="text-sm font-medium text-pure-white">
                {row.customerName ?? '—'}
              </p>
              {row.customerEmail && (
                <p className="text-xs text-steel">{row.customerEmail}</p>
              )}
            </div>
          );
        },
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
        cell: (row) => {
          return (
            <div className="min-w-[180px]">
              <p className="text-sm font-medium text-pure-white">
                {row.vehicleTitle ?? '—'}
              </p>
              {row.vehicleVin && (
                <p className="text-xs text-steel font-mono">{row.vehicleVin}</p>
              )}
            </div>
          );
        },
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
              onClick={() => router.push(`/admin/payments/${row.id}`)}
            >
              <AlertCircle className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  const filterConfigs: FilterConfig[] = React.useMemo(
    () => [
      { id: 'status', label: 'Status', type: 'select', options: PAYMENT_STATUS_OPTIONS },
      { id: 'paymentMethod', label: 'Method', type: 'select', options: PAYMENT_METHOD_OPTIONS },
      { id: 'currency', label: 'Currency', type: 'select', options: CURRENCY_OPTIONS },
      { id: 'orderId', label: 'Order ID', type: 'text' },
      { id: 'dateRange', label: 'Date Range', type: 'date-range' },
    ],
    [],
  );

  const bulkActions: BulkAction[] = React.useMemo(
    () => [
      {
        label: 'Mark Paid',
        action: async (ids) => {
          const result = await bulkUpdatePaymentStatus(ids, 'paid');
          if (result.success) {
            fetchData();
          } else {
            throw new Error(result.error);
          }
        },
      },
      {
        label: 'Mark Failed',
        action: async (ids) => {
          const result = await bulkUpdatePaymentStatus(ids, 'failed');
          if (result.success) {
            fetchData();
          } else {
            throw new Error(result.error);
          }
        },
      },
      {
        label: 'Refund',
        action: async (ids) => {
          const result = await bulkUpdatePaymentStatus(ids, 'refunded');
          if (result.success) {
            fetchData();
          } else {
            throw new Error(result.error);
          }
        },
      },
      {
        label: 'Delete',
        variant: 'destructive',
        confirmMessage:
          'Are you sure you want to delete selected payments? This action cannot be undone.',
        action: async (ids) => {
          const result = await bulkDeletePayments(ids);
          if (result.success) {
            fetchData();
          } else {
            throw new Error(result.error);
          }
        },
      },
    ],
    [fetchData]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Manage payments and invoices for orders"
        action={{ label: 'New Payment', href: '/admin/payments/new', icon: Plus }}
      />

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            description="Total amount from paid payments"
            icon="DollarSign"
            trend={{ value: 0, label: 'vs last month' }}
          />
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(stats.outstandingBalance)}
            description="Amount from pending payments"
            icon="AlertCircle"
            trend={{ value: 0, label: 'vs last month' }}
          />
          <StatCard
            title="Paid Orders"
            value={stats.paidOrders}
            description="Number of fully paid orders"
            icon="CreditCard"
            trend={{ value: 0, label: 'vs last month' }}
          />
          <StatCard
            title="Refunds"
            value={stats.refunds}
            description="Total refunds processed"
            icon="Package"
            trend={{ value: 0, label: 'vs last month' }}
          />
        </div>
      )}

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
        searchPlaceholder="Search by order # or amount..."
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
        emptyTitle="No payments"
        emptyDescription="No payments match your search or filters."
        emptyIcon={Package}
        getRowId={(row) => (row as unknown as PaymentRow).id}
        onRowClick={(row) =>
          router.push(`/admin/payments/${(row as unknown as PaymentRow).id}`)
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