'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Eye, Car, User, Clock, Phone,
  Mail, Globe, Plus, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/admin/table/data-table';
import { FilterBar, type FilterConfig } from '@/components/admin/filters/filter-bar';
import { useFilters } from '@/components/admin/filters/use-filters';
import { PageHeader } from '@/components/admin/ui/page-header';
import { StatCard } from '@/components/admin/ui/stat-card';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { listLeads, getLeadStats } from '@/server/actions/leadActions';
import { LEAD_STATUS_CONFIG, LEAD_STATUS_OPTIONS, LEAD_DEFAULT_PAGE_SIZE } from './constants';
import type { LeadStatus } from './types';

interface LeadRow {
  id: string;
  vehicleId: string;
  userId: string | null;
  message: string;
  status: LeadStatus;
  source: string;
  assignedTo: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerCountry: string | null;
  contactedAt: Date | null;
  createdAt: Date;
  vehicleYear: number | null;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePrice: number | null;
  vehicleStockNumber: string | null;
}

interface DashboardStats {
  totalLeads: number;
  new: number;
  contacted: number;
  qualified: number;
  negotiating: number;
  converted: number;
  lost: number;
}

export function LeadsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<LeadRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(LEAD_DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [sortColumn, setSortColumn] = React.useState('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [searchValue, setSearchValue] = React.useState('');
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const { filters, setFilter, clearAll } = useFilters();

  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await getLeadStats();
      if (result.success && result.data) {
        setStats(result.data as DashboardStats);
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

      const result = await listLeads({
        page,
        limit: pageSize,
        sortColumn,
        sortDirection,
        search: searchValue || undefined,
        status: (filters.status as LeadStatus) || undefined,
        dateFrom: dateRange?.from,
        dateTo: dateRange?.to,
      });

      if (result.success && result.data) {
        const res = result.data as {
          data: LeadRow[];
          meta: { total: number; totalPages: number };
        };
        setData(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load leads', variant: 'error' });
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

  function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatPrice(price: number | null | undefined): string {
    if (price == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  }

  const columns: ColumnDef<LeadRow>[] = React.useMemo(
    () => [
      {
        id: 'customerName',
        header: 'Customer',
        accessorKey: 'customerName',
        sortable: true,
        cell: (row) => (
          <div className="min-w-[140px]">
            <p className="text-sm font-medium text-pure-white">
              {row.customerName || 'Anonymous'}
            </p>
            {row.customerEmail && (
              <p className="text-xs text-steel truncate max-w-[160px]">{row.customerEmail}</p>
            )}
          </div>
        ),
      },
      {
        id: 'vehicle',
        header: 'Vehicle',
        cell: (row) => (
          <div className="min-w-[160px]">
            <p className="text-sm font-medium text-pure-white">
              {row.vehicleYear} {row.vehicleMake} {row.vehicleModel}
            </p>
            {row.vehicleStockNumber && (
              <p className="text-xs text-steel font-mono">{row.vehicleStockNumber}</p>
            )}
          </div>
        ),
      },
      {
        id: 'source',
        header: 'Source',
        accessorKey: 'source',
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-pure-white capitalize">{row.source}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => {
          const config = LEAD_STATUS_CONFIG[row.status as LeadStatus];
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
              onClick={() => router.push(`/admin/leads/${row.id}`)}
            >
              <Eye className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  const filterConfigs: FilterConfig[] = React.useMemo(
    () => [
      { id: 'status', label: 'Status', type: 'select', options: LEAD_STATUS_OPTIONS },
      { id: 'dateRange', label: 'Date Range', type: 'date-range' },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Manage customer enquiries and track conversions"
      />

      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[10px]" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            icon="MessageSquare"
            description={`${stats.new} new leads`}
          />
          <StatCard
            title="In Progress"
            value={stats.contacted + stats.qualified + stats.negotiating}
            icon="Clock"
            description={`${stats.contacted} contacted, ${stats.qualified} qualified`}
          />
          <StatCard
            title="Converted"
            value={stats.converted}
            icon="ShoppingBag"
            description={stats.totalLeads > 0 ? `${Math.round((stats.converted / stats.totalLeads) * 100)}% conversion rate` : 'No conversions yet'}
          />
          <StatCard
            title="Lost"
            value={stats.lost}
            icon="XCircle"
            description={stats.totalLeads > 0 ? `${Math.round((stats.lost / stats.totalLeads) * 100)}% loss rate` : 'No lost leads'}
          />
        </div>
      ) : null}

      <div className="space-y-6">
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
          searchPlaceholder="Search by name, email, phone..."
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
          emptyTitle="No leads"
          emptyDescription="Customer enquiries will appear here once they start arriving."
          emptyIcon={MessageSquare}
          getRowId={(row) => (row as unknown as LeadRow).id}
          onRowClick={(row) =>
            router.push(`/admin/leads/${(row as unknown as LeadRow).id}`)
          }
        />
      </div>
    </div>
  );
}
