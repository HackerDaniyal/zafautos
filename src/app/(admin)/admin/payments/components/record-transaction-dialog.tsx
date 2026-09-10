'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/ui/use-toast';
import { recordTransaction } from '@/server/actions/paymentActions';
import { TRANSACTION_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../constants';

interface RecordTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  orderId: string;
  onRecorded: () => void;
}

export function RecordTransactionDialog({
  open,
  onOpenChange,
  paymentId,
  orderId,
  onRecorded,
}: RecordTransactionDialogProps) {
  const { toast } = useToast();
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('manual');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRecord() {
    if (!amount || parseInt(amount, 10) <= 0) return;
    setLoading(true);
    try {
      const result = await recordTransaction({
        paymentId,
        orderId,
        type: type as 'deposit' | 'balance_payment' | 'refund' | 'adjustment',
        amount: parseInt(amount, 10),
        method,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      });
      if (result.success) {
        toast({ title: 'Transaction recorded', variant: 'success' });
        onOpenChange(false);
        setAmount('');
        setReferenceNumber('');
        setNotes('');
        onRecorded();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to record transaction', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-carbon border-iron">
        <DialogHeader>
          <DialogTitle className="text-pure-white">Record Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm text-ash">Type <span className="text-signal-red">*</span></label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
            >
              {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-ash">Amount <span className="text-signal-red">*</span></label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ash">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-ash">Reference Number</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. TXN-12345"
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-ash">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this transaction..."
              rows={3}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRecord} disabled={loading || !amount || parseInt(amount, 10) <= 0}>
            {loading ? 'Recording...' : 'Record Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
