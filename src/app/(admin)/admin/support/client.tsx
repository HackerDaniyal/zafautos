'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  urgent: 'text-signal-red font-bold',
};

export function AdminSupportListClient({ data, counts }: { data: any; counts: Record<string, number> }) {
  const { data: tickets, meta } = data;
  const router = useRouter();
  const [search, setSearch] = useState('');

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Open', value: counts['open'] ?? 0, color: 'text-emerald-400' },
          { label: 'In Progress', value: counts['in_progress'] ?? 0, color: 'text-blue-400' },
          { label: 'Waiting', value: counts['waiting_customer'] ?? 0, color: 'text-amber-400' },
          { label: 'Resolved', value: counts['resolved'] ?? 0, color: 'text-purple-400' },
          { label: 'Closed', value: counts['closed'] ?? 0, color: 'text-steel' },
          { label: 'Total', value: Object.values(counts).reduce((a, b) => a + b, 0), color: 'text-pure-white' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[8px] border border-iron/10 bg-deep-carbon p-3">
            <p className="text-xs text-steel">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              router.push(`/admin/support?search=${encodeURIComponent(search)}`);
            }
          }}
          placeholder="Search tickets..."
          className="rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red w-64"
        />
        <select
          onChange={(e) => router.push(e.target.value ? `/admin/support?status=${e.target.value}` : '/admin/support')}
          className="rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_customer">Waiting Customer</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          onChange={(e) => router.push(e.target.value ? `/admin/support?priority=${e.target.value}` : '/admin/support')}
          className="rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          onChange={(e) => router.push(e.target.value ? `/admin/support?category=${e.target.value}` : '/admin/support')}
          className="rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
        >
          <option value="">All Categories</option>
          <option value="general">General</option>
          <option value="order">Order</option>
          <option value="payment">Payment</option>
          <option value="shipping">Shipping</option>
          <option value="document">Document</option>
          <option value="vehicle">Vehicle</option>
          <option value="technical">Technical</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Ticket table */}
      {tickets.length === 0 ? (
        <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-12 text-center">
          <p className="text-sm text-steel">No tickets found</p>
        </div>
      ) : (
        <div className="rounded-[10px] border border-iron/10 bg-deep-carbon overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-iron/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-steel">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron/10">
                {tickets.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-iron/5 transition-colors cursor-pointer" onClick={() => router.push(`/admin/support/${ticket.id}`)}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/support/${ticket.id}`} className="text-sm font-medium text-pure-white hover:text-signal-red">
                        {ticket.subject}
                      </Link>
                      <p className="text-xs text-steel mt-0.5">{ticket.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-ash">{ticket.customerName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-ash capitalize">{ticket.category}</td>
                    <td className={`px-4 py-3 text-sm capitalize ${PRIORITY_COLORS[ticket.priority] || ''}`}>{ticket.priority}</td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${STATUS_COLORS[ticket.status] || ''}`}>{ticket.status?.replace('_', ' ')}</Badge></td>
                    <td className="px-4 py-3 text-sm text-ash">{ticket.assignedName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-steel">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/support?page=${p}`}
              className={`h-9 w-9 flex items-center justify-center rounded-[6px] text-sm font-medium transition-colors ${
                p === meta.page ? 'bg-signal-red text-pure-white' : 'bg-iron/10 text-steel hover:bg-iron/20'
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
