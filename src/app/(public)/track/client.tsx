'use client';

import { useState } from 'react';
import { Search, Package, Truck, CreditCard, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusChip, getStatusVariant } from '@/components/admin/ui/status-chip';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';

interface OrderData {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  };
  vehicle: {
    year: number | null;
    vin: string | null;
    stockNumber: string | null;
    status: string | null;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string | null;
    createdAt: string;
  }>;
  paymentSummary: {
    totalAmount: number;
    totalPaid: number;
    balance: number;
  };
  shipments: Array<{
    id: string;
    status: string;
    carrier: string | null;
    trackingNumber: string | null;
    estimatedDeparture: string | null;
    estimatedArrival: string | null;
    actualDeparture: string | null;
    actualArrival: string | null;
  }>;
  trackingEvents: Array<{
    id: string;
    shipmentId: string;
    location: string | null;
    note: string | null;
    createdAt: string;
  }>;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  booked: 'Booked',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  arrived: 'Arrived',
  delivered: 'Delivered',
  delayed: 'Delayed',
  exception: 'Exception',
  cancelled: 'Cancelled',
};

export function TrackOrderClient() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrderData | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/v1/public/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error || 'Order not found');
      }
    } catch {
      setError('Failed to look up order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (data) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 font-[Oswald] uppercase tracking-wide">
            Order Tracking
          </h1>
          <p className="mt-2 text-gray-600">
            Order <span className="font-mono text-gray-900">{data.order.orderNumber}</span>
          </p>
        </div>

        {/* Order Overview */}
        <div className="rounded-[10px] border border-gray-200/30 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="size-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <StatusChip label={ORDER_STATUS_LABELS[data.order.status] || data.order.status} variant={getStatusVariant(data.order.status)} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-medium text-gray-900">{formatPrice(data.order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Order Date</p>
              <p className="text-sm text-gray-900">{format(new Date(data.order.createdAt), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Order Number</p>
              <p className="text-sm font-mono text-gray-900">{data.order.orderNumber}</p>
            </div>
          </div>
        </div>

        {/* Vehicle */}
        {data.vehicle && (
          <div className="rounded-[10px] border border-gray-200/30 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="size-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Vehicle</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">Year</p>
                <p className="text-sm text-gray-900">{data.vehicle.year || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">VIN</p>
                <p className="text-sm font-mono text-gray-900">{data.vehicle.vin || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Stock Number</p>
                <p className="text-sm font-mono text-gray-900">{data.vehicle.stockNumber || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div className="rounded-[10px] border border-gray-200/30 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="size-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Payment Status</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-sm font-medium text-gray-900">{formatPrice(data.paymentSummary.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-sm font-medium text-available-green">{formatPrice(data.paymentSummary.totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Balance Due</p>
              <p className={`text-sm font-medium ${data.paymentSummary.balance > 0 ? 'text-auction-amber' : 'text-available-green'}`}>
                {formatPrice(data.paymentSummary.balance)}
              </p>
            </div>
          </div>
          {data.payments.length > 0 && (
            <div className="space-y-2">
              {data.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-[6px] border border-gray-200/30 bg-gray-50 p-3">
                  <div>
                    <p className="text-sm text-gray-900">{formatPrice(p.amount, p.currency)}</p>
                    <p className="text-xs text-gray-500">{format(new Date(p.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <StatusChip label={PAYMENT_STATUS_LABELS[p.status] || p.status} variant={getStatusVariant(p.status)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shipment Status */}
        <div className="rounded-[10px] border border-gray-200/30 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="size-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Shipment Status</h2>
          </div>
          {data.shipments.length > 0 ? (
            <div className="space-y-4">
              {data.shipments.map((s) => (
                <div key={s.id} className="rounded-[6px] border border-gray-200/30 bg-gray-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <StatusChip label={SHIPMENT_STATUS_LABELS[s.status] || s.status} variant={getStatusVariant(s.status)} />
                    {s.carrier && <p className="text-sm text-gray-600">{s.carrier}</p>}
                  </div>
                  {s.trackingNumber && (
                    <p className="text-xs text-gray-500 mb-2">
                      Tracking: <span className="font-mono text-gray-900">{s.trackingNumber}</span>
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500">Est. Departure</p>
                      <p className="text-gray-900">
                        {s.estimatedDeparture ? format(new Date(s.estimatedDeparture), 'MMM d, yyyy') : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Est. Arrival</p>
                      <p className="text-gray-900">
                        {s.estimatedArrival ? format(new Date(s.estimatedArrival), 'MMM d, yyyy') : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No shipments yet for this order.</p>
          )}
        </div>

        {/* Tracking Timeline */}
        {data.trackingEvents.length > 0 && (
          <div className="rounded-[10px] border border-gray-200/30 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="size-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Tracking Timeline</h2>
            </div>
            <div className="space-y-3">
              {data.trackingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-gray-100 p-1.5">
                    <MapPin className="size-3 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {event.location && (
                        <p className="text-sm font-medium text-gray-900">{event.location}</p>
                      )}
                    </div>
                    {event.note && (
                      <p className="text-xs text-gray-600 mt-0.5">{event.note}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Button variant="outline" onClick={() => { setData(null); setOrderNumber(''); setEmail(''); }}>
            Track Another Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 font-[Oswald] uppercase tracking-wide">
          Track Your Order
        </h1>
        <p className="mt-2 text-gray-600">
          Enter your order number to view status, payment, and shipment details.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mx-auto max-w-md space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Order Number <span className="text-signal-red">*</span></label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. ORD-2026-0015"
            required
            className="w-full rounded-[6px] border border-gray-200/30 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-signal-red"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Email <span className="text-signal-red">*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full rounded-[6px] border border-gray-200/30 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-signal-red"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !orderNumber.trim() || !email.trim()}>
          <Search className="mr-2 size-4" />
          {loading ? 'Looking up...' : 'Track Order'}
        </Button>
        {error && (
          <p className="text-sm text-signal-red text-center">{error}</p>
        )}
      </form>
    </div>
  );
}
