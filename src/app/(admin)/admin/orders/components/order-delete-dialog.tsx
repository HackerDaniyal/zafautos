'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/dialogs/confirm-dialog';
import { useToast } from '@/components/admin/ui/use-toast';
import { softDeleteOrder } from '@/server/actions/orderActions';

interface OrderDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  onDeleted: () => void;
}

export function OrderDeleteDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  onDeleted,
}: OrderDeleteDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const result = await softDeleteOrder(orderId);
      if (result.success) {
        toast({
          title: 'Order deleted',
          description: `Order ${orderNumber} has been deleted.`,
          variant: 'success',
        });
        onOpenChange(false);
        onDeleted();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete order', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Order"
      description={`Are you sure you want to delete order "${orderNumber}"? This will soft-delete the order. You can restore it later from the order list.`}
      variant="destructive"
      confirmLabel="Delete"
      onConfirm={handleDelete}
      loading={loading}
    />
  );
}
