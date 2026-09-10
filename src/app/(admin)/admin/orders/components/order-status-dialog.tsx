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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/admin/ui/use-toast';
import { changeOrderStatus } from '@/server/actions/orderActions';
import { ORDER_STATUS_OPTIONS } from '../constants';
import type { OrderStatus } from '../types';

interface OrderStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentStatus: OrderStatus;
  onStatusChanged: () => void;
  validTransitions: OrderStatus[];
}

export function OrderStatusDialog({
  open,
  onOpenChange,
  orderId,
  currentStatus,
  onStatusChanged,
  validTransitions,
}: OrderStatusDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>(currentStatus);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const availableOptions = ORDER_STATUS_OPTIONS.filter(
    (opt) => validTransitions.includes(opt.value as OrderStatus) || opt.value === currentStatus
  );

  async function handleChange() {
    if (status === currentStatus) return;
    setLoading(true);
    try {
      const result = await changeOrderStatus(orderId, status, note || undefined);
      if (result.success) {
        toast({
          title: 'Status updated',
          description: `Order status changed to ${status}.`,
          variant: 'success',
        });
        onOpenChange(false);
        setNote('');
        onStatusChanged();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-carbon border-iron">
        <DialogHeader>
          <DialogTitle className="text-pure-white">Change Order Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm text-ash">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-deep-carbon border-iron/30 text-pure-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-carbon border-iron">
                {availableOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-ash">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this status change..."
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleChange} disabled={loading || status === currentStatus}>
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
