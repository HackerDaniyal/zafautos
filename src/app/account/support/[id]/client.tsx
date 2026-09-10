'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { replyToTicket, closeMyTicket } from '@/server/actions/supportActions';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  waiting_customer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  closed: 'bg-iron/10 text-steel border-iron/20',
};

export function TicketDetailClient({ ticket }: { ticket: any }) {
  const router = useRouter();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [messages, setMessages] = useState(ticket.messages || []);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const result = await replyToTicket({ ticketId: ticket.id, message: reply.trim() });
      if (result.success) {
        setMessages([...messages, {
          id: result.messageId,
          message: reply.trim(),
          senderType: 'customer',
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

  async function handleClose() {
    if (closing) return;
    setClosing(true);
    try {
      await closeMyTicket(ticket.id);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setClosing(false);
    }
  }

  const canReply = ticket.status !== 'closed' && ticket.status !== 'resolved';

  return (
    <div className="max-w-3xl">
      <Link href="/account/support" className="text-sm text-steel hover:text-pure-white transition-colors">
        &larr; Back to support
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-pure-white">{ticket.subject}</h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <Badge className={`text-xs ${STATUS_COLORS[ticket.status] || ''}`}>{ticket.status?.replace('_', ' ')}</Badge>
            <span className="text-xs text-ash capitalize">{ticket.priority} priority</span>
            <span className="text-xs text-steel capitalize">{ticket.category}</span>
            {ticket.orderInfo && (
              <Link href={`/account/orders/${ticket.orderId}`} className="text-xs text-signal-red hover:text-ember">
                Order {ticket.orderInfo.orderNumber}
              </Link>
            )}
          </div>
        </div>
        {canReply && (
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={closing} className="text-steel hover:text-signal-red shrink-0">
            {closing ? 'Closing...' : 'Close Ticket'}
          </Button>
        )}
      </div>

      <p className="mt-2 text-xs text-steel">Created {new Date(ticket.createdAt).toLocaleString()}</p>

      {/* Staff info */}
      {ticket.assignedInfo && (
        <div className="mt-3 rounded-[8px] bg-deep-carbon border border-iron/10 p-3">
          <p className="text-xs text-steel">Assigned to: <span className="text-ash">{ticket.assignedInfo.email}</span></p>
        </div>
      )}

      {/* Messages */}
      <div className="mt-6 space-y-4">
        {messages.map((m: any) => {
          const isCustomer = m.senderType === 'customer';
          return (
            <div key={m.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-[10px] p-4 ${
                isCustomer ? 'bg-signal-red/10 border border-signal-red/20' : 'bg-deep-carbon border border-iron/10'
              }`}>
                <p className="text-xs font-medium text-steel mb-1">
                  {isCustomer ? 'You' : m.senderType === 'system' ? 'System' : 'Support Agent'}
                </p>
                <p className="text-sm text-pure-white whitespace-pre-wrap">{m.message}</p>
                <p className="mt-2 text-[10px] text-steel">{new Date(m.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      {canReply && (
        <form onSubmit={handleReply} className="mt-6 flex gap-3">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply..."
            className="flex-1 rounded-[6px] border border-iron/30 bg-deep-carbon px-4 py-3 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
          />
          <Button type="submit" disabled={!reply.trim() || sending}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      )}

      {ticket.status === 'closed' && (
        <div className="mt-6 rounded-[8px] bg-deep-carbon border border-iron/10 p-4 text-center">
          <p className="text-sm text-steel">This ticket is closed. Create a new ticket if you need further assistance.</p>
        </div>
      )}
    </div>
  );
}
