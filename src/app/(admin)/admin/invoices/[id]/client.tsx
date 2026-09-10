'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import { getInvoiceDetail } from '@/server/actions/paymentActions';
import type { PaymentStatus } from '@/lib/types/payment';
import { PAYMENT_STATUS_CONFIG } from '@/app/(admin)/admin/payments/constants';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  tax: number;
  discount: number;
  shipping: number;
  subtotal: number;
  total: number;
  balanceDue: number;
  status: string;
  notes: string | null;
  order: {
    orderNumber: string;
    totalAmount: number;
    customer: {
      email: string;
      customerProfile: {
        displayName: string | null;
      } | null;
    } | null;
  } | null;
  payments: Array<{
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

interface InvoicePreviewClientProps {
  invoiceId: string;
}

export function InvoicePreviewClient({ invoiceId }: InvoicePreviewClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getInvoiceDetail(invoiceId);
      if (result.success && result.data) {
        setInvoice(result.data as InvoiceData);
      } else if (!result.success && 'error' in result) {
        setError(result.error || 'Invoice not found');
      } else {
        setError('Invoice not found');
      }
    } catch {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    // Trigger print dialog for PDF save
    window.print();
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-[10px]" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-pure-white">Invoice not found</p>
        <p className="mt-2 text-sm text-ash">{error || 'The requested invoice does not exist.'}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </div>
    );
  }

  const statusConfig = PAYMENT_STATUS_CONFIG[invoice.status as PaymentStatus];
  const totalPaid = invoice.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const customerName = invoice.order?.customer?.customerProfile?.displayName || invoice.order?.customer?.email || '—';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Actions - hidden on print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/orders/${invoice.order?.orderNumber || ''}`}>
            <ArrowLeft className="mr-1 size-4" />
            Back to Order
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1 size-4" />
            Print
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="mr-1 size-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 print:border-0 print:bg-white print:text-black">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide print:text-black">
              INVOICE
            </h1>
            <p className="text-lg text-steel mt-1 print:text-gray-600">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            {statusConfig && (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color} print:bg-gray-100 print:text-gray-800`}>
                {statusConfig.label}
              </span>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold text-steel uppercase tracking-wider mb-2 print:text-gray-500">Invoice Date</p>
            <p className="text-pure-white print:text-black">{format(new Date(invoice.invoiceDate), 'MMMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-steel uppercase tracking-wider mb-2 print:text-gray-500">Due Date</p>
            <p className="text-pure-white print:text-black">
              {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMMM d, yyyy') : '—'}
            </p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-steel uppercase tracking-wider mb-2 print:text-gray-500">Bill To</p>
          <p className="text-pure-white font-medium print:text-black">{customerName}</p>
          <p className="text-ash text-sm print:text-gray-600">{invoice.order?.customer?.email || '—'}</p>
        </div>

        {/* Order Reference */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-steel uppercase tracking-wider mb-2 print:text-gray-500">Order Reference</p>
          <p className="text-pure-white print:text-black">{invoice.order?.orderNumber || '—'}</p>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-iron/30 print:border-gray-300">
                <th className="text-left py-3 text-xs font-semibold text-steel uppercase tracking-wider print:text-gray-500">Description</th>
                <th className="text-right py-3 text-xs font-semibold text-steel uppercase tracking-wider print:text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-iron/20 print:border-gray-200">
                <td className="py-4 text-pure-white print:text-black">
                  <p>Vehicle Purchase</p>
                  <p className="text-sm text-ash print:text-gray-500">Order {invoice.order?.orderNumber}</p>
                </td>
                <td className="py-4 text-right text-pure-white print:text-black">{formatPrice(invoice.subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ash print:text-gray-600">Subtotal</span>
              <span className="text-pure-white print:text-black">{formatPrice(invoice.subtotal)}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ash print:text-gray-600">Tax</span>
                <span className="text-pure-white print:text-black">{formatPrice(invoice.tax)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ash print:text-gray-600">Discount</span>
                <span className="text-pure-white print:text-black">-{formatPrice(invoice.discount)}</span>
              </div>
            )}
            {invoice.shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ash print:text-gray-600">Shipping</span>
                <span className="text-pure-white print:text-black">{formatPrice(invoice.shipping)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-iron/30 pt-2 print:border-gray-300">
              <span className="text-pure-white print:text-black">Total</span>
              <span className="text-pure-white print:text-black">{formatPrice(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ash print:text-gray-600">Paid</span>
              <span className="text-available-green print:text-green-600">{formatPrice(totalPaid)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-pure-white print:text-black">Balance Due</span>
              <span className={`print:text-black ${invoice.balanceDue > 0 ? 'text-auction-amber' : 'text-available-green'}`}>
                {formatPrice(invoice.balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-steel uppercase tracking-wider mb-3 print:text-gray-500">Payment History</p>
            <div className="space-y-2">
              {invoice.payments.map((payment, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-iron/20 print:border-gray-200">
                  <div>
                    <p className="text-sm text-pure-white print:text-black">{format(new Date(payment.createdAt), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-ash print:text-gray-500">{payment.status}</p>
                  </div>
                  <span className="text-sm font-medium text-pure-white print:text-black">{formatPrice(payment.amount, payment.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-steel uppercase tracking-wider mb-2 print:text-gray-500">Notes</p>
            <p className="text-ash text-sm print:text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-iron/30 pt-6 print:border-gray-300">
          <p className="text-xs text-center text-ash print:text-gray-500">
            Thank you for your business. For questions about this invoice, please contact us.
          </p>
        </div>
      </div>
    </div>
  );
}
