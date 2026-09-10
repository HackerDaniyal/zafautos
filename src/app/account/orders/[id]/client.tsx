'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  booked: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  picked_up: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  in_transit: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  arrived: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  delayed: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  exception: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function OrderDetailClient({ order }: { order: any }) {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/account/orders" className="text-sm text-steel hover:text-pure-white transition-colors">
          &larr; Back to orders
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-pure-white">{order.orderNumber}</h1>
            <Badge className={`text-xs ${STATUS_COLORS[order.status] || ''}`}>{order.status}</Badge>
          </div>
          <Link
            href={`/account/support?create=1&orderId=${order.id}&category=order`}
            className="inline-flex items-center gap-2 rounded-[6px] border border-iron/30 px-4 py-2 text-sm text-ash hover:border-iron/50 hover:text-pure-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Contact Support
          </Link>
        </div>
        <p className="text-sm text-steel mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Vehicle */}
      {order.vehicle && (
        <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-5">
          <h2 className="text-sm font-semibold text-pure-white mb-3">Vehicle</h2>
          <div className="flex items-center gap-4">
            {order.vehicle.imageUrl && (
              <img src={order.vehicle.imageUrl} alt="" className="h-16 w-24 rounded object-cover" />
            )}
            <div>
              <p className="text-sm font-medium text-pure-white">
                {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
              </p>
              {order.vehicle.stockNumber && (
                <p className="text-xs text-steel mt-0.5">Stock: {order.vehicle.stockNumber}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment summary */}
      <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-5">
        <h2 className="text-sm font-semibold text-pure-white mb-3">Payment Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-ash">Total</span>
            <span className="text-pure-white font-medium">{formatPrice(order.paymentSummary.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ash">Paid</span>
            <span className="text-emerald-400 font-medium">{formatPrice(order.paymentSummary.totalPaid)}</span>
          </div>
          <div className="border-t border-iron/10 pt-2 flex justify-between text-sm">
            <span className="text-ash">Balance Due</span>
            <span className={`font-medium ${order.paymentSummary.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatPrice(order.paymentSummary.balance)}
            </span>
          </div>
        </div>

        {order.payments.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-steel mb-2">Payment History</p>
            <div className="space-y-1">
              {order.payments.map((p: any, i: number) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-ash">{new Date(p.createdAt).toLocaleDateString()} — {p.status}</span>
                  <span className="text-pure-white">{formatPrice(p.amount, p.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shipments */}
      {order.shipments.length > 0 && (
        <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-5">
          <h2 className="text-sm font-semibold text-pure-white mb-3">Shipments</h2>
          <div className="space-y-3">
            {order.shipments.map((s: any) => (
              <div key={s.id} className="rounded-[8px] border border-iron/10 bg-race-black/50 p-4">
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs ${SHIPMENT_STATUS_COLORS[s.status] || ''}`}>{s.status}</Badge>
                  {s.carrier && <span className="text-sm text-ash">{s.carrier}</span>}
                  {s.trackingNumber && <span className="text-xs text-steel font-mono">{s.trackingNumber}</span>}
                </div>
                {s.vessel && <p className="mt-2 text-xs text-steel">Vessel: {s.vessel}</p>}
                {s.estimatedArrival && (
                  <p className="mt-1 text-xs text-steel">ETA: {new Date(s.estimatedArrival).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {order.timeline.length > 0 && (
        <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-5">
          <h2 className="text-sm font-semibold text-pure-white mb-3">Timeline</h2>
          <div className="space-y-3">
            {order.timeline.map((t: any, i: number) => (
              <div key={i} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-signal-red mt-1.5 shrink-0" />
                  {i < order.timeline.length - 1 && <div className="w-px flex-1 bg-iron/20 mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm text-pure-white">{t.event}</p>
                  <p className="text-xs text-steel">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {(order.orderDocuments.length > 0 || order.shippingDocuments.length > 0) && (
        <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-5">
          <h2 className="text-sm font-semibold text-pure-white mb-3">Documents</h2>
          <div className="space-y-2">
            {order.orderDocuments.map((d: any) => (
              <a
                key={d.id}
                href={d.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-signal-red hover:text-ember transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Order Document
              </a>
            ))}
            {order.shippingDocuments.map((d: any) => (
              <a
                key={d.id}
                href={d.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-signal-red hover:text-ember transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {d.documentName || d.documentType || 'Shipping Document'}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
