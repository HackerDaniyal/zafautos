'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/ui/page-header';
import { useToast } from '@/components/admin/ui/use-toast';
import { createShipment, updateShipment } from '@/server/actions/shippingActions';
import { SHIPMENT_STATUS_OPTIONS } from '../constants';
import type { ShipmentStatus } from '../types';

interface OrderOption {
  id: string;
  orderNumber: string;
  status: string;
}

interface ShipmentFormPageProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    orderId: string;
    carrier: string | null;
    status: string;
  };
}

export function ShipmentFormPage({ mode, initialData }: ShipmentFormPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(initialData?.orderId ?? '');
  const [carrier, setCarrier] = useState(initialData?.carrier ?? '');
  const [status, setStatus] = useState<ShipmentStatus>(
    (initialData?.status as ShipmentStatus) ?? 'pending'
  );

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'create') {
        const result = await createShipment({
          orderId,
          carrier: carrier || undefined,
          status,
        });
        if (result.success) {
          toast({ title: 'Shipment created', variant: 'success' });
          router.push('/admin/shipping');
        } else {
          toast({ title: 'Error', description: result.error, variant: 'error' });
        }
      } else {
        const result = await updateShipment(initialData!.id, {
          orderId,
          carrier: carrier || undefined,
        });
        if (result.success) {
          toast({ title: 'Shipment updated', variant: 'success' });
          router.push(`/admin/shipping/${initialData!.id}`);
        } else {
          toast({ title: 'Error', description: result.error, variant: 'error' });
        }
      }
    } catch {
      toast({
        title: 'Error',
        description: `Failed to ${mode} shipment`,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  const selectedOrder = orders.find((o) => o.id === orderId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Create Shipment' : 'Edit Shipment'}
        description={mode === 'create' ? 'Create a new shipment for an order' : `Editing shipment ${initialData?.id.slice(0, 8)}`}
        action={{
          label: 'Back to Shipping',
          href: '/admin/shipping',
          icon: ArrowLeft,
        }}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Shipment Information</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">
                Order <span className="text-signal-red">*</span>
              </label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={loadingOptions || mode === 'edit'}
                required
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                <option value="">Select order...</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} ({o.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-ash">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
                disabled={mode === 'edit'}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                {SHIPMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">Carrier</label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. Maersk, MSC, CMA CGM"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>
          </div>

          {selectedOrder && (
            <div className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4">
              <p className="text-xs text-steel mb-2">Selected Order</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-pure-white">
                    {selectedOrder.orderNumber}
                  </p>
                  <p className="text-xs text-steel">
                    Status: {selectedOrder.status}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href="/admin/shipping">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || !orderId.trim()}>
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
                ? 'Create Shipment'
                : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
