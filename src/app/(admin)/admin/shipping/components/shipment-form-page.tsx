'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/ui/page-header';
import { useToast } from '@/components/admin/ui/use-toast';
import { createShipment, updateShipment } from '@/server/actions/shippingActions';
import { SHIPMENT_STATUS_OPTIONS } from '../constants';
import type { ShipmentStatus } from '../types';
import { formatPrice } from '@/lib/utils';

interface OrderOption {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
}

interface PortOption {
  id: string;
  name: string;
  code: string | null;
}

interface ShipmentFormPageProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    orderId: string;
    carrier: string | null;
    trackingNumber: string | null;
    vessel: string | null;
    bookingReference: string | null;
    shippingCost: number | null;
    originPortId: string | null;
    destinationPortId: string | null;
    estimatedDeparture: string | null;
    estimatedArrival: string | null;
    actualDeparture: string | null;
    actualArrival: string | null;
    status: string;
  };
}

function toDatetimeLocal(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 16);
}

export function ShipmentFormPage({ mode, initialData }: ShipmentFormPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillOrderId = searchParams.get('orderId') || '';
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(initialData?.orderId ?? prefillOrderId);
  const [carrier, setCarrier] = useState(initialData?.carrier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(initialData?.trackingNumber ?? '');
  const [vessel, setVessel] = useState(initialData?.vessel ?? '');
  const [bookingReference, setBookingReference] = useState(initialData?.bookingReference ?? '');
  const [shippingCost, setShippingCost] = useState(initialData?.shippingCost != null ? String(initialData.shippingCost) : '0');
  const [status, setStatus] = useState<ShipmentStatus>((initialData?.status as ShipmentStatus) ?? 'pending');
  const [originPortId, setOriginPortId] = useState(initialData?.originPortId ?? '');
  const [destinationPortId, setDestinationPortId] = useState(initialData?.destinationPortId ?? '');
  const [estimatedDeparture, setEstimatedDeparture] = useState(toDatetimeLocal(initialData?.estimatedDeparture));
  const [estimatedArrival, setEstimatedArrival] = useState(toDatetimeLocal(initialData?.estimatedArrival));
  const [actualDeparture, setActualDeparture] = useState(toDatetimeLocal(initialData?.actualDeparture));
  const [actualArrival, setActualArrival] = useState(toDatetimeLocal(initialData?.actualArrival));

  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [ports, setPorts] = useState<PortOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [ordersRes, portsRes] = await Promise.all([
        fetch('/api/v1/orders'),
        fetch('/api/v1/shipping/ports').catch(() => null),
      ]);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.data ?? data ?? []);
      }
      if (portsRes?.ok) {
        const data = await portsRes.json();
        setPorts(data.data ?? data ?? []);
      }
    } catch {
      // Options loaded best-effort
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  const selectedOrder = orders.find((o) => o.id === orderId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const parseDate = (s: string) => s ? new Date(s) : null;
      if (mode === 'create') {
        const result = await createShipment({
          orderId,
          carrier: carrier || undefined,
          trackingNumber: trackingNumber || undefined,
          vessel: vessel || undefined,
          bookingReference: bookingReference || undefined,
          shippingCost: parseInt(shippingCost, 10) || 0,
          status,
          originPortId: originPortId || null,
          destinationPortId: destinationPortId || null,
          estimatedDeparture: parseDate(estimatedDeparture),
          estimatedArrival: parseDate(estimatedArrival),
          actualDeparture: parseDate(actualDeparture),
          actualArrival: parseDate(actualArrival),
        });
        if (result.success) {
          toast({ title: 'Shipment created', variant: 'success' });
          router.push('/admin/shipping');
        } else {
          toast({ title: 'Error', description: result.error, variant: 'error' });
        }
      } else {
        const result = await updateShipment(initialData!.id, {
          carrier: carrier || undefined,
          trackingNumber: trackingNumber || undefined,
          vessel: vessel || undefined,
          bookingReference: bookingReference || undefined,
          shippingCost: parseInt(shippingCost, 10) || 0,
          originPortId: originPortId || null,
          destinationPortId: destinationPortId || null,
          estimatedDeparture: parseDate(estimatedDeparture),
          estimatedArrival: parseDate(estimatedArrival),
          actualDeparture: parseDate(actualDeparture),
          actualArrival: parseDate(actualArrival),
        });
        if (result.success) {
          toast({ title: 'Shipment updated', variant: 'success' });
          router.push(`/admin/shipping/${initialData!.id}`);
        } else {
          toast({ title: 'Error', description: result.error, variant: 'error' });
        }
      }
    } catch {
      toast({ title: 'Error', description: `Failed to ${mode} shipment`, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Create Shipment' : 'Edit Shipment'}
        description={mode === 'create' ? 'Create a new shipment for an order' : `Editing shipment`}
        action={{ label: 'Back to Shipping', href: '/admin/shipping', icon: ArrowLeft }}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Order & Status */}
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Order & Status</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">Order <span className="text-signal-red">*</span></label>
              <select value={orderId} onChange={(e) => setOrderId(e.target.value)} disabled={loadingOptions || mode === 'edit' || !!prefillOrderId} required
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red">
                <option value="">Select order...</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>{o.orderNumber} — {formatPrice(o.totalAmount)} ({o.status})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ash">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)} disabled={mode === 'edit'}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red">
                {SHIPMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {selectedOrder && (
            <div className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4">
              <p className="text-xs text-steel mb-2">Selected Order</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pure-white">{selectedOrder.orderNumber}</p>
                  <p className="text-xs text-steel">Status: {selectedOrder.status}</p>
                </div>
                <p className="text-sm font-medium text-pure-white">{formatPrice(selectedOrder.totalAmount)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Carrier & Tracking */}
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Carrier & Tracking</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-ash">Carrier</label>
              <input type="text" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. Maersk, MSC"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ash">Tracking Number</label>
              <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. 1Z999AA10123456784"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ash">Vessel</label>
              <input type="text" value={vessel} onChange={(e) => setVessel(e.target.value)} placeholder="e.g. MV Ever Given"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">Booking Reference</label>
              <input type="text" value={bookingReference} onChange={(e) => setBookingReference(e.target.value)} placeholder="e.g. BK-2026-001"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ash">Shipping Cost (USD)</label>
              <input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} min="0"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red" />
            </div>
          </div>
        </div>

        {/* Ports */}
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Ports</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">Origin Port</label>
              <select value={originPortId} onChange={(e) => setOriginPortId(e.target.value)} disabled={loadingOptions}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red">
                <option value="">Select origin...</option>
                {ports.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ash">Destination Port</label>
              <select value={destinationPortId} onChange={(e) => setDestinationPortId(e.target.value)} disabled={loadingOptions}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red">
                <option value="">Select destination...</option>
                {ports.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Schedule</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">Estimated Departure</label>
              <input type="datetime-local" value={estimatedDeparture} onChange={(e) => setEstimatedDeparture(e.target.value)}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ash">Estimated Arrival</label>
              <input type="datetime-local" value={estimatedArrival} onChange={(e) => setEstimatedArrival(e.target.value)}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">Actual Departure</label>
              <input type="datetime-local" value={actualDeparture} onChange={(e) => setActualDeparture(e.target.value)}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ash">Actual Arrival</label>
              <input type="datetime-local" value={actualArrival} onChange={(e) => setActualArrival(e.target.value)}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild><Link href="/admin/shipping">Cancel</Link></Button>
          <Button type="submit" disabled={loading || !orderId}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            {loading ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Shipment' : 'Save Changes')}
          </Button>
        </div>
      </form>
    </div>
  );
}
