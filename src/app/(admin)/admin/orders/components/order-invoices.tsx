'use client';

import { useState } from 'react';
import { FileText, Plus, Loader2, Download, Eye, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { useToast } from '@/components/admin/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import { createInvoice } from '@/server/actions/paymentActions';
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
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const invoices = order.invoices;

  const totalPaid = order.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

  // Check if there's an active (non-cancelled, non-deleted) invoice
  const hasActiveInvoice = invoices?.some(inv => inv.status !== 'cancelled' && !inv.deletedAt);

  async function handleGenerateInvoice() {
    if (generating) return;
    setGenerating(true);
    try {
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30);

      const result = await createInvoice({
        orderId,
        invoiceDate: now,
        dueDate,
        tax: 0,
        discount: 0,
        shipping: 0,
        subtotal: order.totalAmount || 0,
        total: order.totalAmount || 0,
        balanceDue: Math.max(0, order.totalAmount - totalPaid),
        status: 'draft',
      });

      if (result.success) {
        toast({ title: 'Invoice generated', variant: 'success' });
        onRefresh();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate invoice', variant: 'error' });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteInvoice(invoiceId: string) {
    setDeletingId(invoiceId);
    try {
      // Import deleteInvoice action dynamically or add it
      const { deleteInvoice } = await import('@/server/actions/paymentActions');
      const result = await deleteInvoice(invoiceId);
      if (result.success) {
        toast({ title: 'Invoice deleted', variant: 'success' });
        onRefresh();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'error' });
    } finally {
      setDeletingId(null);
    }
  }

  function handlePreview(invoice: { id: string; invoiceNumber: string }) {
    window.open(`/admin/invoices/${invoice.id}`, '_blank');
  }

  function handleDownload(invoice: { id: string; invoiceNumber: string }) {
    window.open(`/admin/invoices/${invoice.id}?download=true`, '_blank');
  }

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
            <Button size="sm" onClick={handleGenerateInvoice} disabled={generating}>
              {generating ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Plus className="mr-1 size-4" />
              )}
              {generating ? 'Generating...' : 'Generate Invoice'}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const statusConfig = PAYMENT_STATUS_CONFIG[invoice.status as PaymentStatus];
            const isActive = invoice.status !== 'cancelled' && !invoice.deletedAt;
            return (
              <div
                key={invoice.id}
                className="rounded-[10px] border border-iron/30 bg-carbon p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="rounded-full bg-iron/20 p-2 shrink-0">
                      <FileText className="size-4 text-steel" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-pure-white truncate">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-steel">
                        {format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}
                        {invoice.dueDate && ` · Due ${format(new Date(invoice.dueDate), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium text-pure-white whitespace-nowrap">
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
                    {isActive && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handlePreview(invoice)}
                          title="Preview invoice"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDownload(invoice)}
                          title="Download invoice"
                        >
                          <Download className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={deletingId === invoice.id}
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          title="Delete invoice"
                        >
                          {deletingId === invoice.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5 text-signal-red" />
                          )}
                        </Button>
                      </div>
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
