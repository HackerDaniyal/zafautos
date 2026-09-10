'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { convertLeadToOrder } from '@/server/actions/leadActions';
import { useToast } from '@/components/admin/ui/use-toast';

interface ConvertToOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    vehicle: {
      id: string;
      year: number | null;
      make: string;
      model: string;
      price: number | null;
      stockNumber: string | null;
      vin: string | null;
    } | null;
  };
  onConverted: (orderId: string, orderNumber: string) => void;
}

type ConversionState = 'idle' | 'confirming' | 'loading' | 'success' | 'error';

export function ConvertToOrderDialog({
  open,
  onOpenChange,
  lead,
  onConverted,
}: ConvertToOrderDialogProps) {
  const { toast } = useToast();
  const [state, setState] = useState<ConversionState>('idle');
  const [result, setResult] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && state === 'loading') return; // Prevent closing while loading
    onOpenChange(isOpen);
    if (!isOpen) {
      // Reset state after close animation
      setTimeout(() => {
        setState('idle');
        setResult(null);
        setErrorMessage(null);
      }, 200);
    }
  }

  function handleConfirmClick() {
    setState('loading');
    handleConversion();
  }

  async function handleConversion() {
    try {
      const response = await convertLeadToOrder({ leadId: lead.id });

      if (!response.success) {
        setErrorMessage(response.error || 'Conversion failed');
        setState('error');
        toast({
          title: 'Conversion Failed',
          description: response.error,
          variant: 'error',
        });
        return;
      }

      const data = response.data as { orderId: string; orderNumber: string };
      setResult(data);
      setState('success');
      toast({
        title: 'Order Created',
        description: `${data.orderNumber} has been created successfully.`,
        variant: 'success',
      });
      onConverted(data.orderId, data.orderNumber);
    } catch {
      setErrorMessage('An unexpected error occurred');
      setState('error');
      toast({
        title: 'Conversion Failed',
        description: 'An unexpected error occurred.',
        variant: 'error',
      });
    }
  }

  function formatPrice(price: number | null | undefined): string {
    if (price == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {state === 'idle' || state === 'confirming' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRight className="size-5 text-signal-red" />
                Convert Lead to Order
              </DialogTitle>
              <DialogDescription>
                This will create an order from this enquiry and mark the vehicle as sold.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Customer Info */}
              <div className="rounded-md bg-deep-carbon p-3">
                <p className="text-xs text-steel mb-1">Customer</p>
                <p className="text-sm font-medium text-pure-white">
                  {lead.customerName || 'Anonymous'}
                </p>
                {lead.customerEmail && (
                  <p className="text-xs text-steel">{lead.customerEmail}</p>
                )}
                {lead.customerPhone && (
                  <p className="text-xs text-steel">{lead.customerPhone}</p>
                )}
              </div>

              {/* Vehicle Info */}
              {lead.vehicle && (
                <div className="rounded-md bg-deep-carbon p-3">
                  <p className="text-xs text-steel mb-1">Vehicle</p>
                  <p className="text-sm font-medium text-pure-white">
                    {lead.vehicle.year} {lead.vehicle.make} {lead.vehicle.model}
                  </p>
                  <div className="flex gap-3 mt-1">
                    {lead.vehicle.price != null && (
                      <p className="text-xs text-pure-white">{formatPrice(lead.vehicle.price)}</p>
                    )}
                    {lead.vehicle.stockNumber && (
                      <p className="text-xs text-steel font-mono">Stock: {lead.vehicle.stockNumber}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="flex gap-2 rounded-md bg-auction-amber/10 border border-auction-amber/20 p-3">
                <AlertTriangle className="size-4 text-auction-amber shrink-0 mt-0.5" />
                <div className="text-xs text-auction-amber">
                  <p className="font-medium">This action cannot be undone.</p>
                  <p className="mt-1">
                    The vehicle will be marked as sold and a pending order will be created.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmClick}
                className="bg-signal-red text-pure-white hover:bg-deep-red"
              >
                <ArrowRight className="mr-1.5 size-3.5" />
                Create Order
              </Button>
            </DialogFooter>
          </>
        ) : state === 'loading' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="size-5 text-signal-red animate-spin" />
                Creating Order...
              </DialogTitle>
              <DialogDescription>
                Processing conversion. Please do not close this dialog.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="size-8 text-signal-red animate-spin mx-auto" />
                <p className="text-sm text-steel">Creating order and marking vehicle as sold...</p>
              </div>
            </div>
          </>
        ) : state === 'success' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-available-green" />
                Order Created
              </DialogTitle>
              <DialogDescription>
                The lead has been converted and the order is ready for processing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-md bg-available-green/10 border border-available-green/20 p-3 text-center">
                <p className="text-2xl font-bold text-available-green font-mono">
                  {result?.orderNumber}
                </p>
              </div>

              <div className="rounded-md bg-deep-carbon p-3 space-y-1">
                <p className="text-xs text-steel">Vehicle</p>
                <p className="text-sm text-pure-white">
                  {lead.vehicle?.year} {lead.vehicle?.make} {lead.vehicle?.model}
                </p>
                <p className="text-xs text-steel mt-1">Status</p>
                <Badge variant="outline" className="bg-available-green/10 text-available-green border-transparent">
                  Sold
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
              <Button asChild>
                <Link href={`/admin/orders/${result?.orderId}`}>
                  <ExternalLink className="mr-1.5 size-3.5" />
                  View Order
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* error state */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-signal-red" />
                Conversion Failed
              </DialogTitle>
              <DialogDescription>
                {errorMessage || 'An unexpected error occurred during conversion.'}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-md bg-signal-red/10 border border-signal-red/20 p-3">
              <p className="text-sm text-signal-red">{errorMessage}</p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setState('idle');
                  setErrorMessage(null);
                }}
                className="bg-signal-red text-pure-white hover:bg-deep-red"
              >
                Try Again
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
