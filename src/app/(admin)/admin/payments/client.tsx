'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard, Plus, Eye, RotateCcw, Trash2, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { PageHeader } from '@/components/admin/ui/page-header';
import { StatCard } from '@/components/admin/ui/stat-card';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { StatusChip, getStatusVariant } from '@/components/admin/ui/status-chip';
import { formatPrice } from '@/lib/utils';
import {
  listPayments,
  getPaymentStats,
  changePaymentStatus,
  bulkDeletePayments,
  bulkUpdatePaymentStatus,
} from '@/server/actions/paymentActions';
import { PAYMENT_STATUS_CONFIG, PAYMENT_STATUS_OPTIONS, PAYMENT_DEFAULT_PAGE_SIZE } from './constants';
import type { PaymentStatus } from './types';

interface Payment {
  id: string;
  orderId: string | null;
  userId: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  referenceNumber: string | null;
  createdAt: string;
}

interface DashboardStats {
  totalRevenue: number;
  outstandingBalance: number;
  paidOrders: number;
  unpaidOrders: number;
  partialPayments: number;
  refunds: number;
  monthlyRevenue: number;
  upcomingDuePayments: number;
}

export function PaymentsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAYMENT_DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listPayments({
        page,
        limit: pageSize,
        search,
        status: statusFilter || undefined,
      });
      if (result.success) {
        const raw = result.data as { data: Payment[]; total: number; page: number; pageSize: number; totalPages: number } | Payment[];
        if (Array.isArray(raw)) {
          setItems(raw);
          setTotal(raw.length);
          setTotalPages(1);
        } else {
          setItems(raw.data ?? []);
          setTotal(raw.total ?? 0);
          setTotalPages(raw.totalPages ?? 1);
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load payments', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, toast]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await getPaymentStats();
      if (result.success && result.data) {
        setStats(result.data as DashboardStats);
      }
    } catch {
      // Stats loaded best-effort
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    const result = await bulkDeletePayments(Array.from(selected));
    if (result.success) {
      toast({ title: `${selected.size} payment(s) deleted`, variant: 'success' });
      setSelected(new Set());
      fetchData();
      fetchStats();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleBulkMarkPaid() {
    if (selected.size === 0) return;
    const result = await bulkUpdatePaymentStatus(Array.from(selected), 'paid');
    if (result.success) {
      toast({ title: `${selected.size} payment(s) marked as paid`, variant: 'success' });
      setSelected(new Set());
      fetchData();
      fetchStats();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  function handleExportCsv() {
    const headers = ['ID', 'Order ID', 'Amount', 'Currency', 'Method', 'Reference', 'Status', 'Created'];
    const rows = items.map((p) => [
      p.id,
      p.orderId ?? '',
      String(p.amount),
      p.currency,
      p.paymentMethod ?? '',
      p.referenceNumber ?? '',
      p.status,
      new Date(p.createdAt).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Manage payments and invoices"
        action={{ label: 'Record Payment', href: '/admin/payments/new', icon: Plus }}
      />

      {statsLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[10px]" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Revenue" value={formatPrice(stats.totalRevenue)} icon="DollarSign" color="text-available-green" variant="compact" />
          <StatCard label="Outstanding" value={formatPrice(stats.outstandingBalance)} icon="AlertCircle" color="text-auction-amber" variant="compact" />
          <StatCard label="Paid" value={String(stats.paidOrders)} icon="Check" color="text-available-green" variant="compact" />
          <StatCard label="Refunded" value={String(stats.refunds)} icon="RotateCcw" color="text-steel" variant="compact" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Search payments..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-9 rounded-[6px] border border-iron/30 bg-deep-carbon px-3 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-[6px] border border-iron/30 bg-deep-carbon px-3 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
        >
          <option value="">All Status</option>
          {PAYMENT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={items.length === 0}>
            <Download className="mr-1 size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-[6px] border border-signal-red/30 bg-signal-red/5 px-4 py-2">
          <span className="text-sm text-pure-white">{selected.size} selected</span>
          <Button variant="outline" size="sm" onClick={handleBulkMarkPaid}>
            <RotateCcw className="mr-1 size-3.5" />
            Mark Paid
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkDelete} className="border-signal-red/30 text-signal-red hover:bg-signal-red/10">
            <Trash2 className="mr-1 size-3.5" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <div className="rounded-[10px] border border-iron/30 bg-carbon">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-iron border-t-signal-red" />
            <p className="mt-2 text-sm text-steel">Loading payments...</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No payments"
            description={search || statusFilter ? 'No payments match your filters.' : 'No payments found.'}
            icon={CreditCard}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-iron/30 text-left text-xs font-medium uppercase tracking-wider text-steel">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === items.length && items.length > 0}
                      onChange={toggleAll}
                      className="size-3.5 rounded border-iron/30"
                    />
                  </th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron/30">
                {items.map((item) => {
                  const statusCfg = PAYMENT_STATUS_CONFIG[item.status as PaymentStatus];
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-deep-carbon/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/payments/${item.id}`)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="size-3.5 rounded border-iron/30"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-pure-white">
                          {formatPrice(item.amount, item.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-ash">{item.paymentMethod ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-steel font-mono">{item.referenceNumber ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip
                          label={statusCfg?.label || item.status}
                          variant={getStatusVariant(item.status)}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-steel">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-xs" asChild>
                            <Link href={`/admin/payments/${item.id}`}>
                              <Eye className="size-3.5 text-steel" />
                            </Link>
                          </Button>
                          {item.status !== 'paid' && item.status !== 'refunded' && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={async () => {
                                const result = await changePaymentStatus(item.id, 'paid');
                                if (result.success) {
                                  toast({ title: 'Payment marked as paid', variant: 'success' });
                                  fetchData();
                                  fetchStats();
                                }
                              }}
                              title="Mark Paid"
                            >
                              <RotateCcw className="size-3.5 text-available-green" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-steel">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
