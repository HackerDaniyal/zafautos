'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { PageHeader } from '@/components/admin/ui/page-header';
import {
  listPayments,
  getPaymentStats,
  changePaymentStatus,
} from '@/server/actions/paymentActions';

interface Payment {
  id: string;
  orderId: string | null;
  userId: string | null;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  referenceNumber: string | null;
  createdAt: string;
}

function PaymentsClient() {
  const [items, setItems] = useState<Payment[]>([]);
  const [stats, setStats] = useState<{
    totalRevenue: number;
    outstandingBalance: number;
    paidOrders: number;
    unpaidOrders: number;
    partialPayments: number;
    refunds: number;
    monthlyRevenue: number;
    upcomingDuePayments: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [result, statsResult] = await Promise.all([
        listPayments({ limit: 50, search, status: statusFilter || undefined }),
        getPaymentStats(),
      ]);

      if (result.success) {
        const data = ((result.data as { data: Payment[] }).data ?? result.data as Payment[]);
        setItems(data);
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to load payments' });
      }

      if (statsResult.success) {
        setStats(statsResult.data as {
          totalRevenue: number;
          outstandingBalance: number;
          paidOrders: number;
          unpaidOrders: number;
          partialPayments: number;
          refunds: number;
          monthlyRevenue: number;
          upcomingDuePayments: number;
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  async function handleStatusChange(payment: Payment, newStatus: string) {
    try {
      const result = await changePaymentStatus(payment.id, newStatus);
      if (result.success) {
        setFeedback({ type: 'success', message: `Payment marked as ${newStatus}` });
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to update' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update' });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Manage payments and invoices" />

      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Revenue" value={`$${(stats.totalRevenue / 100).toFixed(2)}`} />
          <StatCard label="Outstanding" value={`$${(stats.outstandingBalance / 100).toFixed(2)}`} />
          <StatCard label="Paid Orders" value={stats.paidOrders.toString()} />
          <StatCard label="Refunded" value={stats.refunds.toString()} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search payments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-deep-carbon border-iron/30 text-pure-white max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white focus-visible:border-signal-red outline-none"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

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
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron/30">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-deep-carbon/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-steel">{item.orderId ? item.orderId.slice(0, 8) : '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-pure-white">
                        {item.currency} {(item.amount / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-ash">{item.method ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-steel">{item.referenceNumber ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.status === 'paid' ? 'bg-green-500/10 text-green-400' : item.status === 'pending' ? 'bg-auction-amber/10 text-auction-amber' : item.status === 'refunded' ? 'bg-iron/30 text-steel' : 'bg-destructive/10 text-destructive'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-steel">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.status !== 'paid' && item.status !== 'refunded' && (
                          <Button variant="ghost" size="icon-xs" onClick={() => handleStatusChange(item, 'paid')} title="Mark Paid">
                            <RotateCcw className="size-3.5 text-green-400" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
      <p className="text-xs text-steel">{label}</p>
      <p className="mt-1 text-2xl font-bold text-pure-white">{value}</p>
    </div>
  );
}

export { PaymentsClient };
