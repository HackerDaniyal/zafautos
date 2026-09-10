'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/dialogs/confirm-dialog';
import { useToast } from '@/components/admin/ui/use-toast';
import { softDeleteVehicle } from '@/server/actions/vehicleActions';

interface VehicleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleName: string;
  onDeleted: () => void;
}

export function VehicleDeleteDialog({
  open,
  onOpenChange,
  vehicleId,
  vehicleName,
  onDeleted,
}: VehicleDeleteDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const result = await softDeleteVehicle(vehicleId);
      if (result.success) {
        toast({
          title: 'Vehicle deleted',
          description: `${vehicleName} has been deleted.`,
          variant: 'success',
        });
        onOpenChange(false);
        onDeleted();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete vehicle', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Vehicle"
      description={`Are you sure you want to delete "${vehicleName}"? This will soft-delete the vehicle. You can restore it later from the vehicle list.`}
      variant="destructive"
      confirmLabel="Delete"
      onConfirm={handleDelete}
      loading={loading}
    />
  );
}
