'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string | Date;
  vehicle: { make: string | null; model: string | null; year: number | null; stockNumber: string | null } | null;
}

export function OrdersListClient({ data, currentStatus }: { data: { orders: Order[]; total: number; page: number; pageSize: number; totalPages: number }; currentStatus?: string }) {
  const { orders, total, page, totalPages } = data;

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <Link
            key={s}
            href={s ? `/account/orders?status=${s}` : '/account/orders'}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              (currentStatus || '') === s
                ? 'bg-signal-red text-pure-white'
                : 'bg-iron/10 text-steel hover:bg-iron/20 hover:text-pure-white'
            }`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-sm text-steel">No orders found</p>
          <Link href="/vehicles">
            <Button className="mt-4" variant="default">Browse Vehicles</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block rounded-[10px] border border-iron/10 bg-deep-carbon p-4 hover:border-iron/25 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-pure-white">{order.orderNumber}</p>
                    <Badge className={`text-xs ${STATUS_COLORS[order.status] || ''}`}>{order.status}</Badge>
                  </div>
                  {order.vehicle && (
                    <p className="mt-1 text-sm text-ash">
                      {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                      {order.vehicle.stockNumber && <span className="ml-2 text-steel">({order.vehicle.stockNumber})</span>}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-pure-white">{formatPrice(order.totalAmount)}</p>
                  <p className="text-xs text-steel">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/account/orders?page=${p}${currentStatus ? `&status=${currentStatus}` : ''}`}
              className={`h-9 w-9 flex items-center justify-center rounded-[6px] text-sm font-medium transition-colors ${
                p === page ? 'bg-signal-red text-pure-white' : 'bg-iron/10 text-steel hover:bg-iron/20'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
