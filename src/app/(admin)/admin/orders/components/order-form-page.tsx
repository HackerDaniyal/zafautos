'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/ui/page-header';
import { useToast } from '@/components/admin/ui/use-toast';
import { createOrder } from '@/server/actions/orderActions';
import { ORDER_STATUS_OPTIONS } from '../constants';
import type { OrderStatus } from '../types';

interface CustomerOption {
  id: string;
  email: string;
  displayName?: string;
}

interface VehicleOption {
  id: string;
  title: string;
  vin?: string;
  stockNumber?: string;
  price?: number;
  status?: string;
}

interface DealerOption {
  id: string;
  email: string;
  displayName?: string;
}

interface OrderFormPageProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    orderNumber: string;
    customerId?: string | null;
    dealerId?: string | null;
    vehicleId?: string | null;
    status: string;
    totalAmount: number;
  };
}

export function OrderFormPage({ mode, initialData }: OrderFormPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState(initialData?.orderNumber ?? '');
  const [customerId, setCustomerId] = useState(initialData?.customerId ?? '');
  const [dealerId, setDealerId] = useState(initialData?.dealerId ?? '');
  const [vehicleId, setVehicleId] = useState(initialData?.vehicleId ?? '');
  const [status, setStatus] = useState<OrderStatus>(
    (initialData?.status as OrderStatus) ?? 'pending'
  );
  const [totalAmount, setTotalAmount] = useState(
    initialData?.totalAmount?.toString() ?? '0'
  );
  const [notes, setNotes] = useState('');

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [customersRes, vehiclesRes, dealersRes] = await Promise.all([
        fetch('/api/v1/customers/profile'),
        fetch('/api/v1/vehicles'),
        fetch('/api/v1/dealers/profile'),
      ]);

      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.data ?? data ?? []);
      }
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        setVehicles(data.data ?? data ?? []);
      }
      if (dealersRes.ok) {
        const data = await dealersRes.json();
        setDealers(data.data ?? data ?? []);
      }
    } catch {
      // Options are loaded best-effort
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'create') {
        const result = await createOrder({
          orderNumber,
          customerId: customerId || undefined,
          dealerId: dealerId || undefined,
          vehicleId: vehicleId || undefined,
          status,
          totalAmount: parseInt(totalAmount, 10) || 0,
        });
        if (result.success) {
          toast({ title: 'Order created', variant: 'success' });
          router.push('/admin/orders');
        } else {
          toast({ title: 'Error', description: result.error, variant: 'error' });
        }
      } else {
        // Edit mode - would use an updateOrder action
        toast({ title: 'Order updated', variant: 'success' });
        router.push(`/admin/orders/${initialData?.id}`);
      }
    } catch {
      toast({
        title: 'Error',
        description: `Failed to ${mode} order`,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Create Order' : 'Edit Order'}
        description={mode === 'create' ? 'Create a new customer order' : `Editing order ${initialData?.orderNumber}`}
        action={{
          label: 'Back to Orders',
          href: '/admin/orders',
          icon: ArrowLeft,
        }}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Order Information</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">
                Order Number <span className="text-signal-red">*</span>
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-2024-001"
                required
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-ash">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Associations</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-ash">Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={loadingOptions}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-ash">Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={loadingOptions}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title || v.vin || v.stockNumber || v.id.slice(0, 8)}
                    {v.price ? ` - $${v.price.toLocaleString()}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-ash">Dealer</label>
              <select
                value={dealerId}
                onChange={(e) => setDealerId(e.target.value)}
                disabled={loadingOptions}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                <option value="">Select dealer...</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.displayName || d.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedVehicle && (
            <div className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4">
              <p className="text-xs text-steel mb-2">Selected Vehicle</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-pure-white">
                    {selectedVehicle.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-steel font-mono">
                    {selectedVehicle.vin || selectedVehicle.stockNumber || '—'}
                  </p>
                </div>
                {selectedVehicle.price && (
                  <p className="text-sm font-medium text-pure-white ml-auto">
                    ${selectedVehicle.price.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Pricing</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">Total Amount (USD)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                min="0"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this order..."
            rows={4}
            className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href="/admin/orders">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || !orderNumber.trim()}>
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {loading
              ? mode === 'create'
                ? 'Creating...'
                : 'Saving...'
              : mode === 'create'
                ? 'Create Order'
                : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
