'use client';

import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { useToast } from '@/components/admin/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import type { OrderDetail } from '../types';
import type { PaymentStatus } from '@/lib/types/payment';
import { PAYMENT_STATUS_CONFIG } from '../constants';

interface OrderInvoicesProps {
  orderId: string;
  order: OrderDetail;
  onRefresh: () => void;
}

export function OrderInvoices({ orderId, order, onRefresh }: OrderInvoicesProps) {
  const { toast } = useToast();
  const invoices = (order as unknown as Record<string, unknown>).invoices as Array<{
    id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    invoiceDate: string;
    dueDate?: string | null;
    tax: number;
    discount: number;
    shipping: number;
    subtotal: number;
    balanceDue: number;
    notes?: string | null;
  }> | undefined;

  const totalPaid = order.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
          <p className="text-xs text-steel">Total Invoiced</p>
          <p className="text-xl font-bold text-pure-white mt-1">{formatPrice(totalInvoiced)}</p>
        </div>
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
          <p className="text-xs text-steel">Total Paid</p>
          <p className="text-xl font-bold text-available-green mt-1">{formatPrice(totalPaid)}</p>
        </div>
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
          <p className="text-xs text-steel">Balance Due</p>
          <p className={`text-xl font-bold mt-1 ${totalInvoiced - totalPaid > 0 ? 'text-auction-amber' : 'text-available-green'}`}>
            {formatPrice(totalInvoiced - totalPaid)}
          </p>
        </div>
      </div>

      {!invoices || invoices.length === 0 ? (
        <EmptyState
          title="No invoices"
          description="No invoices have been generated for this order yet."
          icon={FileText}
          action={
            <Button size="sm">
              <Plus className="mr-1 size-4" />
              Generate Invoice
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const statusConfig = PAYMENT_STATUS_CONFIG[invoice.status as PaymentStatus];
            return (
              <div
                key={invoice.id}
                className="rounded-[10px] border border-iron/30 bg-carbon p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-iron/20 p-2">
                      <FileText className="size-4 text-steel" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-pure-white">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-steel">
                        {format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}
                        {invoice.dueDate && ` · Due ${format(new Date(invoice.dueDate), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-pure-white">
                      {formatPrice(invoice.total)}
                    </span>
                    {statusConfig && (
                      <Badge
                        variant="outline"
                        className={`${statusConfig.bgColor} ${statusConfig.color} border-transparent`}
                      >
                        {statusConfig.label}
                      </Badge>
                    )}
                  </div>
                </div>
                {invoice.notes && (
                  <p className="mt-2 text-xs text-ash">{invoice.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
