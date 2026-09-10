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
import { changeVehicleStatus } from '@/server/actions/vehicleActions';
import { VEHICLE_STATUS_OPTIONS } from '../constants';
import type { VehicleStatus } from '../types';

interface VehicleStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  currentStatus: VehicleStatus;
  onStatusChanged: () => void;
}

export function VehicleStatusDialog({
  open,
  onOpenChange,
  vehicleId,
  currentStatus,
  onStatusChanged,
}: VehicleStatusDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<VehicleStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    setLoading(true);
    try {
      const result = await changeVehicleStatus(vehicleId, status);
      if (result.success) {
        toast({
          title: 'Status updated',
          description: `Vehicle status changed to ${status}.`,
          variant: 'success',
        });
        onOpenChange(false);
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
          <DialogTitle className="text-pure-white">Change Vehicle Status</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Select value={status} onValueChange={(v) => setStatus(v as VehicleStatus)}>
            <SelectTrigger className="bg-deep-carbon border-iron/30 text-pure-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-carbon border-iron">
              {VEHICLE_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
