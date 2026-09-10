'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateTicketDialog } from './create-ticket-dialog';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  waiting_customer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  closed: 'bg-iron/10 text-steel border-iron/20',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-steel',
  medium: 'text-ash',
  high: 'text-amber-400',
  urgent: 'text-signal-red',
};

export function SupportListClient({ data, currentStatus, defaultOrderId, defaultCategory }: { data: any; currentStatus?: string; defaultOrderId?: string; defaultCategory?: string }) {
  const { data: tickets, meta } = data;
  const [showCreate, setShowCreate] = useState(!!defaultOrderId);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={() => setShowCreate(true)}>Create Support Request</Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['', 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'].map((s) => (
          <Link
            key={s}
            href={s ? `/account/support?status=${s}` : '/account/support'}
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

      {tickets.length === 0 ? (
        <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="mt-4 text-sm text-steel">No support tickets yet</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>Create your first request</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => (
            <Link
              key={ticket.id}
              href={`/account/support/${ticket.id}`}
              className="block rounded-[10px] border border-iron/10 bg-deep-carbon p-4 hover:border-iron/25 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-pure-white truncate">{ticket.subject}</p>
                    <Badge className={`text-xs ${STATUS_COLORS[ticket.status] || ''}`}>{ticket.status?.replace('_', ' ')}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-steel">
                    <span className={`font-medium ${PRIORITY_COLORS[ticket.priority] || ''}`}>{ticket.priority}</span>
                    <span>{ticket.category}</span>
                    {ticket.orderId && <span>Order-related</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-steel">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  <p className="text-[10px] text-steel mt-0.5">Updated {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/account/support?page=${p}${currentStatus ? `&status=${currentStatus}` : ''}`}
              className={`h-9 w-9 flex items-center justify-center rounded-[6px] text-sm font-medium transition-colors ${
                p === meta.page ? 'bg-signal-red text-pure-white' : 'bg-iron/10 text-steel hover:bg-iron/20'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}

      <CreateTicketDialog open={showCreate} onOpenChange={setShowCreate} defaultOrderId={defaultOrderId} defaultCategory={defaultCategory} />
    </div>
  );
}
