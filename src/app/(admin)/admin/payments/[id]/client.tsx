'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Trash2,
  User,
  Car,
  CreditCard,
  Truck,
  FileText,
  Clock,
  StickyNote,
  Eye,
  Copy,
  ExternalLink,
  Check,
  DollarSign,
  Package,
  Hash,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { StatusChip, getStatusVariant } from '@/components/admin/ui/status-chip';
import { DetailGroup, DetailGrid } from '@/components/admin/drawer/detail-sections';
import { ActivityTimeline } from '@/components/admin/timeline/activity-timeline';
import type { TimelineActivity } from '@/components/admin/timeline/timeline-entry';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { cn, formatPrice } from '@/lib/utils';
import { getPayment, changePaymentStatus } from '@/server/actions/paymentActions';
import { PAYMENT_STATUS_CONFIG, PAYMENT_METHOD_OPTIONS } from '../constants';
import { PAYMENT_STATUS_TRANSITIONS, type PaymentDetail } from '../types';
import { PaymentNotes } from '../components/payment-notes';
import { PaymentStatusDialog } from '../components/payment-status-dialog';
import { OrderDocuments } from '@/components/admin/components/order-documents';
import { CopyButton } from '@/components/admin/ui/copy-button';
import { StatCard } from '@/components/admin/ui/stat-card';

interface PaymentDetailClientProps {
  paymentId: string;
}

type Tab = 'overview' | 'invoice' | 'transactions' | 'customer' | 'order' | 'shipping' | 'documents' | 'timeline' | 'notes';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'invoice', label: 'Invoice', icon: CreditCard },
  { id: 'transactions', label: 'Transactions', icon: DollarSign },
  { id: 'customer', label: 'Customer', icon: User },
  { id: 'order', label: 'Order', icon: Package },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'notes', label: 'Notes', icon: StickyNote },
];

export function PaymentDetailClient({ paymentId }: PaymentDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const fetchPayment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPayment(paymentId);
      if (result.success && result.data) {
        setPayment(result.data as PaymentDetail);
      } else if (!result.success) {
        setError(result.error || 'Payment not found');
      }
    } catch {
      setError('Failed to load payment');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard`, variant: 'default' });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-1 border-b border-iron/30 overflow-x-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[10px] border border-iron/30 bg-carbon p-6">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-96 rounded-[10px]" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-pure-white">Payment not found</p>
        <p className="mt-2 text-sm text-ash">{error || 'The requested payment does not exist.'}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/payments">
            <ArrowLeft className="mr-2 size-4" />
            Back to Payments
          </Link>
        </Button>
      </div>
    );
  }

  const statusConfig = PAYMENT_STATUS_CONFIG[payment.status as keyof typeof PAYMENT_STATUS_CONFIG];
  const paymentMethod = PAYMENT_METHOD_OPTIONS.find((m) => m.value === payment.paymentMethod);

  const totalPaid = payment.transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const balance = payment.amount - totalPaid;

  const validTransitions = PAYMENT_STATUS_TRANSITIONS[payment.status] || [];

  const activityTimeline: TimelineActivity[] = [
    ...(payment.history || []).map((history) => ({
      id: history.id,
      type: 'status_changed' as const,
      actor: { name: 'Admin', email: 'admin@zafautos.com' },
      target: { type: 'payment', name: `Status: ${history.status}`, id: payment.id },
      details: history.note ? { note: history.note } : undefined,
      timestamp: history.createdAt,
    })),
    ...(payment.transactions || []).map((transaction) => ({
      id: transaction.id,
      type: 'created' as const,
      actor: { name: 'System', email: 'system@zafautos.com' },
      target: { type: 'transaction', name: `${transaction.type} - ${formatPrice(transaction.amount, transaction.method)}`, id: transaction.id },
      details: {
        type: transaction.type,
        method: transaction.method,
        referenceNumber: transaction.referenceNumber,
        amount: transaction.amount,
        notes: transaction.notes,
      },
      timestamp: transaction.transactionDate,
    })),
    {
      id: 'created',
      type: 'created' as const,
      actor: { name: 'System', email: 'system@zafautos.com' },
      target: { type: 'payment', name: `Payment $${formatPrice(payment.amount, payment.currency)}`, id: payment.id },
      timestamp: payment.createdAt,
    },
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
              Payment Details
            </h1>
            <StatusChip
              label={statusConfig?.label || payment.status}
              variant={getStatusVariant(payment.status)}
            />
          </div>
          <p className="text-sm text-ash">
            {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
            {payment.updatedAt !== payment.createdAt && (
              <> · Updated {formatDistanceToNow(new Date(payment.updatedAt), { addSuffix: true })}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/payments">
              <ArrowLeft className="mr-1 size-4" />
              Back
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => setStatusDialogOpen(true)}
            disabled={validTransitions.length === 0}
          >
            Change Status
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeleteDialogOpen(true)}
            title="Delete payment"
          >
            <Trash2 className="size-4 text-signal-red" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-iron/30 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-signal-red text-signal-red'
                : 'border-transparent text-steel hover:text-pure-white'
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              variant="compact"
              label="Total Amount"
              value={formatPrice(payment.amount)}
              icon="DollarSign"
              color="text-pure-white"
            />
            <StatCard
              variant="compact"
              label="Paid Amount"
              value={formatPrice(totalPaid)}
              icon="Check"
              color="text-available-green"
            />
            <StatCard
              variant="compact"
              label="Balance"
              value={formatPrice(balance)}
              icon="AlertCircle"
              color={balance > 0 ? 'text-auction-amber' : 'text-available-green'}
            />
            <StatCard
              variant="compact"
              label="Method"
              value={paymentMethod?.label || 'N/A'}
              icon="CreditCard"
              color={paymentMethod ? 'text-pure-white' : 'text-steel'}
            />
          </div>

          <DetailGroup title="Payment Information">
            <DetailGrid
              fields={[
                {
                  label: 'Payment ID',
                  value: (
                    <span className="flex items-center">
                      {payment.id}
                      <CopyButton text={payment.id} label="Payment ID" />
                    </span>
                  ),
                },
                { label: 'Order ID', value: payment.orderId },
                { label: 'Status', value: statusConfig?.label || payment.status },
                { label: 'Created', value: format(new Date(payment.createdAt), 'PPpp') },
                { label: 'Currency', value: payment.currency },
                { label: 'Reference', value: payment.referenceNumber || '—' },
                { label: 'Total Amount', value: formatPrice(payment.amount) },
                { label: 'Paid Amount', value: formatPrice(totalPaid) },
                { label: 'Balance Due', value: formatPrice(balance) },
              ]}
              columns={3}
            />
          </DetailGroup>

          <DetailGroup title="Quick Actions">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusDialogOpen(true)}
                disabled={validTransitions.length === 0}
              >
                Change Status
              </Button>
              {payment.referenceNumber && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(payment.referenceNumber!, 'Reference number')}
                >
                  <Copy className="mr-1 size-3.5" />
                  Copy Reference #
                </Button>
              )}
            </div>
          </DetailGroup>
        </div>
      )}

      {activeTab === 'invoice' && (
        <div className="space-y-6">
          <DetailGroup title="Invoice Information">
            <DetailGrid
              fields={[
                { label: 'Status', value: payment.status },
                { label: 'Created', value: format(new Date(payment.createdAt), 'PPpp') },
              ]}
              columns={2}
            />
          </DetailGroup>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <DetailGroup title="Transactions">
            {(payment.transactions || []).length > 0 ? (
              <div className="space-y-2">
                {payment.transactions?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-iron/20 p-2">
                        <DollarSign className="size-4 text-steel" />
                      </div>
                      <div>
                        <p className="text-sm text-pure-white">
                          {formatPrice(transaction.amount, transaction.method)}
                        </p>
                        <p className="text-xs text-steel">
                          {format(new Date(transaction.transactionDate), 'PPpp')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip
                        label={transaction.type}
                        variant={getStatusVariant(transaction.type)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
                <p className="text-ash">No transactions recorded for this payment.</p>
              </div>
            )}
          </DetailGroup>
        </div>
      )}

      {activeTab === 'customer' && (
        <div className="space-y-6">
          {payment.customer ? (
            <>
              <DetailGroup title="Customer Information">
                <DetailGrid
                  fields={[
                    {
                      label: 'Name',
                      value: (
                        <span className="flex items-center">
                          {payment.customer.displayName || '—'}
                          {payment.customer.displayName && (
                            <CopyButton text={payment.customer.displayName} label="Customer name" />
                          )}
                        </span>
                      ),
                    },
                    { label: 'Email', value: payment.customer.email },
                  ]}
                  columns={2}
                />
              </DetailGroup>
              <DetailGroup title="Actions">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/customers/${payment.customer?.id}`}>
                    <ExternalLink className="mr-1 size-3.5" />
                    View Customer Profile
                  </Link>
                </Button>
              </DetailGroup>
            </>
          ) : (
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
              <p className="text-ash">No customer assigned to this payment.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'order' && (
        <div className="space-y-6">
          {payment.order ? (
            <>
              <DetailGroup title="Order Information">
                <DetailGrid
                  fields={[
                    {
                      label: 'Order Number',
                      value: (
                        <span className="flex items-center">
                          {payment.order?.orderNumber}
                          {payment.order?.orderNumber && (
                            <CopyButton text={payment.order.orderNumber} label="Order number" />
                          )}
                        </span>
                      ),
                    },
                    { label: 'Status', value: payment.order?.status },
                    { label: 'Total Amount', value: formatPrice(payment.order.totalAmount) },
                  ]}
                  columns={3}
                />
              </DetailGroup>
              <DetailGroup title="Actions">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/orders/${payment.orderId}`}>
                    <ExternalLink className="mr-1 size-3.5" />
                    View Order Details
                  </Link>
                </Button>
              </DetailGroup>
            </>
          ) : (
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
              <p className="text-ash">No order assigned to this payment.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="space-y-6">
          <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
            <p className="text-ash">Shipping information is not available for this payment.</p>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <DetailGroup title="Payment Documents">
            <OrderDocuments
              orderId={payment.orderId}
              documents={payment.documents || []}
              onDocumentsChanged={fetchPayment}
            />
          </DetailGroup>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
          <ActivityTimeline
            activities={activityTimeline}
            emptyMessage="No activity recorded for this payment yet."
          />
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-6">
          <DetailGroup title="Notes">
            <PaymentNotes
              paymentId={paymentId}
              notes={payment.history || []}
              onNotesChanged={fetchPayment}
            />
          </DetailGroup>
        </div>
      )}

      <PaymentStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        paymentId={paymentId}
        currentStatus={payment.status}
        onStatusChanged={fetchPayment}
        validTransitions={validTransitions}
      />
    </div>
  );
}