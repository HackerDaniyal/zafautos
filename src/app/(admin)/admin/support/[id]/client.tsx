'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { replyToTicketAdmin, updateSupportTicketAdmin } from '@/server/actions/supportActions';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  waiting_customer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  closed: 'bg-iron/10 text-steel border-iron/20',
};

export function AdminTicketDetailClient({ ticket }: { ticket: any }) {
  const router = useRouter();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState(ticket.messages || []);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const result = await replyToTicketAdmin({ ticketId: ticket.id, message: reply.trim() });
      if (result.success) {
        setMessages([...messages, {
          id: result.messageId,
          message: reply.trim(),
          senderType: 'staff',
          createdAt: new Date().toISOString(),
        }]);
        setReply('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(status: string) {
    await updateSupportTicketAdmin({ ticketId: ticket.id, status });
    router.refresh();
  }

  async function handlePriorityChange(priority: string) {
    await updateSupportTicketAdmin({ ticketId: ticket.id, priority });
    router.refresh();
  }

  return (
    <div className="max-w-5xl">
      <Link href="/admin/support" className="text-sm text-steel hover:text-pure-white transition-colors">
        &larr; Back to support
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-pure-white">{ticket.subject}</h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <Badge className={`text-xs ${STATUS_COLORS[ticket.status] || ''}`}>{ticket.status?.replace('_', ' ')}</Badge>
            <span className="text-xs text-ash capitalize">{ticket.priority} priority</span>
            <span className="text-xs text-steel capitalize">{ticket.category}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main: Conversation */}
        <div>
          {/* Messages */}
          <div className="space-y-4">
            {messages.map((m: any) => {
              const isCustomer = m.senderType === 'customer';
              const isSystem = m.senderType === 'system';
              return (
                <div key={m.id} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-[10px] p-4 ${
                    isSystem ? 'bg-amber-500/5 border border-amber-500/20'
                    : isCustomer ? 'bg-deep-carbon border border-iron/10'
                    : 'bg-signal-red/10 border border-signal-red/20'
                  }`}>
                    <p className="text-xs font-medium text-steel mb-1">
                      {isSystem ? 'System' : isCustomer ? `Customer` : 'You (Staff)'}
                    </p>
                    <p className="text-sm text-pure-white whitespace-pre-wrap">{m.message}</p>
                    <p className="mt-2 text-[10px] text-steel">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply box */}
          <form onSubmit={handleReply} className="mt-6 flex gap-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a reply..."
              rows={3}
              className="flex-1 rounded-[6px] border border-iron/30 bg-deep-carbon px-4 py-3 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red resize-none"
            />
            <Button type="submit" disabled={!reply.trim() || sending} className="self-end">
              {sending ? 'Sending...' : 'Send Reply'}
            </Button>
          </form>
        </div>

        {/* Right sidebar: Details */}
        <div className="space-y-4">
          {/* Status */}
          <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-4">
            <h3 className="text-xs font-medium text-steel mb-3">Status</h3>
            <div className="flex flex-wrap gap-2">
              {['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    ticket.status === s ? 'bg-signal-red text-pure-white' : 'bg-iron/10 text-steel hover:bg-iron/20'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-4">
            <h3 className="text-xs font-medium text-steel mb-3">Priority</h3>
            <div className="flex flex-wrap gap-2">
              {['low', 'medium', 'high', 'urgent'].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriorityChange(p)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${
                    ticket.priority === p ? 'bg-signal-red text-pure-white' : 'bg-iron/10 text-steel hover:bg-iron/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-4 space-y-3">
            <div>
              <p className="text-xs text-steel">Customer</p>
              <p className="text-sm text-pure-white">{ticket.customerInfo?.email || '—'}</p>
            </div>
            {ticket.orderInfo && (
              <div>
                <p className="text-xs text-steel">Related Order</p>
                <Link href={`/admin/orders/${ticket.orderId}`} className="text-sm text-signal-red hover:text-ember">
                  {ticket.orderInfo.orderNumber}
                </Link>
              </div>
            )}
            {ticket.vehicleInfo && (
              <div>
                <p className="text-xs text-steel">Vehicle</p>
                <p className="text-sm text-pure-white">{ticket.vehicleInfo.year} {ticket.vehicleInfo.make} {ticket.vehicleInfo.model}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-steel">Created</p>
              <p className="text-sm text-pure-white">{new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-steel">Updated</p>
              <p className="text-sm text-pure-white">{new Date(ticket.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
