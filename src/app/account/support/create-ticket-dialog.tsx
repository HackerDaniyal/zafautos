'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createSupportTicket } from '@/server/actions/supportActions';

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOrderId?: string;
  defaultCategory?: string;
}

export function CreateTicketDialog({ open, onOpenChange, defaultOrderId, defaultCategory }: CreateTicketDialogProps) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(defaultCategory || 'general');
  const [priority, setPriority] = useState('medium');
  const [orderId, setOrderId] = useState(defaultOrderId || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await createSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        orderId: orderId || undefined,
      });
      if (result.success) {
        onOpenChange(false);
        router.push(`/account/support/${result.ticketId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-[10px] border border-iron/10 bg-deep-carbon p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-pure-white">Create Support Request</h2>
          <button onClick={() => onOpenChange(false)} className="text-steel hover:text-pure-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-steel">Subject <span className="text-signal-red">*</span></label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              required
              className="mt-1 w-full rounded-[6px] border border-iron/30 bg-race-black px-3 py-2.5 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-steel">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-[6px] border border-iron/30 bg-race-black px-3 py-2.5 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
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
            <div>
              <label className="text-xs text-steel">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-[6px] border border-iron/30 bg-race-black px-3 py-2.5 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {!defaultOrderId && (
            <div>
              <label className="text-xs text-steel">Related Order ID (optional)</label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Leave empty if not order-related"
                className="mt-1 w-full rounded-[6px] border border-iron/30 bg-race-black px-3 py-2.5 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-steel">Description <span className="text-signal-red">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in detail..."
              required
              rows={5}
              className="mt-1 w-full rounded-[6px] border border-iron/30 bg-race-black px-3 py-2.5 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red resize-none"
            />
          </div>

          {error && <p className="text-sm text-signal-red">{error}</p>}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !subject.trim() || !description.trim()}>
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
