'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/ui/page-header';
import { useToast } from '@/components/admin/ui/use-toast';
import { createPayment } from '@/server/actions/paymentActions';
import { PAYMENT_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, CURRENCY_OPTIONS } from '../constants';

interface OrderOption {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
}

export function PaymentFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillOrderId = searchParams.get('orderId') || '';
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(prefillOrderId);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [status, setStatus] = useState('pending');

  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const response = await fetch('/api/v1/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data ?? data ?? []);
      }
    } catch {
      // Options loaded best-effort
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const selectedOrder = orders.find((o) => o.id === orderId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createPayment({
        orderId,
        amount: parseInt(amount, 10) || 0,
        currency,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        status: status as 'pending' | 'paid' | 'failed' | 'refunded',
      });
      if (result.success) {
        toast({ title: 'Payment created', variant: 'success' });
        router.push('/admin/payments');
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create payment', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Payment"
        description="Record a new payment for an order"
        action={{
          label: 'Back to Payments',
          href: '/admin/payments',
          icon: ArrowLeft,
        }}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Payment Information</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">
                Order <span className="text-signal-red">*</span>
              </label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={loadingOptions || !!prefillOrderId}
                required
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                <option value="">Select order...</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — ${o.totalAmount.toLocaleString()} ({o.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-ash">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedOrder && (
            <div className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4">
              <p className="text-xs text-steel mb-2">Selected Order</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pure-white">
                    {selectedOrder.orderNumber}
                  </p>
                  <p className="text-xs text-steel">
                    Status: {selectedOrder.status}
                  </p>
                </div>
                <p className="text-sm font-medium text-pure-white">
                  ${selectedOrder.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Amount & Method</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-ash">
                Amount <span className="text-signal-red">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                required
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-ash">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-ash">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-ash">Reference Number</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. TXN-12345, bank transfer reference"
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href="/admin/payments">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || !orderId || !amount}>
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {loading ? 'Creating...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
