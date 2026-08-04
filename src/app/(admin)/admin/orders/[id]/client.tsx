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
import { getOrderDetail } from '@/server/actions/orderActions';
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  SHIPPING_STATUS_CONFIG,
} from '../constants';
import { ORDER_STATUS_TRANSITIONS, type OrderStatus, type OrderDetail } from '../types';
import type { PaymentStatus } from '@/lib/types/payment';
import { OrderDeleteDialog } from '../components/order-delete-dialog';
import { OrderStatusDialog } from '../components/order-status-dialog';
import { OrderNotes } from '../components/order-notes';
import { OrderDocuments } from '../components/order-documents';
import { OrderInvoices } from '../components/order-invoices';
import { OrderAuditLog } from '../components/order-audit-log';
import { CopyButton } from '@/components/admin/ui/copy-button';
import { StatCard } from '@/components/admin/ui/stat-card';

type Tab = 'overview' | 'customer' | 'vehicle' | 'payment' | 'invoices' | 'shipping' | 'documents' | 'timeline' | 'notes' | 'audit';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'customer', label: 'Customer', icon: User },
  { id: 'vehicle', label: 'Vehicle', icon: Car },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'audit', label: 'Audit Log', icon: Clock },
];

interface OrderDetailClientProps {
  orderId: string;
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getOrderDetail(orderId);
      if (result.success && result.data) {
        setOrder(result.data as OrderDetail);
      } else if (!result.success) {
        setError(result.error || 'Order not found');
      }
    } catch {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

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
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[10px]" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-[10px]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-pure-white">Order not found</p>
        <p className="mt-2 text-sm text-ash">{error || 'The requested order does not exist.'}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 size-4" />
            Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus];
  const paymentConfig = order.payments?.[0]?.status
    ? PAYMENT_STATUS_CONFIG[order.payments[0].status as PaymentStatus]
    : null;
  const shipmentConfig = order.shipments?.[0]?.status
    ? SHIPPING_STATUS_CONFIG[order.shipments[0].status as string]
    : null;

  const totalPaid = order.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const balance = order.totalAmount - totalPaid;

  const validTransitions = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] || [];

  const activityTimeline: TimelineActivity[] = [
    ...(order.timeline || []).map((event) => ({
      id: event.id,
      type: 'updated' as const,
      actor: { name: 'System', email: 'system@zafautos.com' },
      target: { type: 'order', name: event.event, id: event.orderId },
      timestamp: event.createdAt,
    })),
    ...(order.statusHistory || []).map((status) => ({
      id: status.id,
      type: 'status_changed' as const,
      actor: { name: 'Admin', email: 'admin@zafautos.com' },
      target: { type: 'order', name: `Status: ${status.status}`, id: status.orderId },
      details: status.note ? { note: status.note } : undefined,
      timestamp: status.createdAt,
    })),
    {
      id: 'created',
      type: 'created' as const,
      actor: { name: 'System', email: 'system@zafautos.com' },
      target: { type: 'order', name: `Order ${order.orderNumber}`, id: order.id },
      timestamp: order.createdAt,
    },
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
              Order {order.orderNumber}
            </h1>
            <StatusChip
              label={statusConfig?.label || order.status}
              variant={getStatusVariant(order.status)}
            />
          </div>
          <p className="text-sm text-ash">
            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
            {order.updatedAt !== order.createdAt && (
              <> · Updated {formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true })}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders">
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
            title="Delete order"
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
              value={formatPrice(order.totalAmount)}
              icon="DollarSign"
              color="text-pure-white"
            />
            <StatCard
              variant="compact"
              label="Items"
              value={String(order.items?.length || 0)}
              icon="Package"
              color="text-pure-white"
            />
            <StatCard
              variant="compact"
              label="Status"
              value={statusConfig?.label || order.status}
              icon="Hash"
              color={statusConfig?.color || 'text-pure-white'}
            />
            <StatCard
              variant="compact"
              label="Payment"
              value={paymentConfig?.label || 'N/A'}
              icon="AlertCircle"
              color={paymentConfig?.color || 'text-steel'}
            />
          </div>

          <DetailGroup title="Order Information">
            <DetailGrid
              fields={[
                {
                  label: 'Order Number',
                  value: (
                    <span className="flex items-center">
                      {order.orderNumber}
                      <CopyButton text={order.orderNumber} label="Order number" />
                    </span>
                  ),
                },
                { label: 'Status', value: statusConfig?.label || order.status },
                { label: 'Created', value: format(new Date(order.createdAt), 'PPpp') },
                { label: 'Updated', value: format(new Date(order.updatedAt), 'PPpp') },
                { label: 'Total Amount', value: formatPrice(order.totalAmount) },
                { label: 'Items Count', value: String(order.items?.length || 0) },
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
              {order.orderNumber && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(order.orderNumber, 'Order number')}
                >
                  <Copy className="mr-1 size-3.5" />
                  Copy Order #
                </Button>
              )}
            </div>
          </DetailGroup>
        </div>
      )}

      {activeTab === 'customer' && (
        <div className="space-y-6">
          {order.customer ? (
            <>
              <DetailGroup title="Customer Information">
                <DetailGrid
                  fields={[
                    { label: 'Name', value: order.customer.profile?.firstName && order.customer.profile?.lastName
                      ? `${order.customer.profile.firstName} ${order.customer.profile.lastName}`
                      : '—' },
                    { label: 'Email', value: order.customer.email || '—' },
                    { label: 'Phone', value: order.customer.profile?.phone || '—' },
                    { label: 'Country', value: order.customer.profile?.country || '—' },
                  ]}
                  columns={2}
                />
              </DetailGroup>
              <DetailGroup title="Actions">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/customers/${order.customerId}`}>
                    <ExternalLink className="mr-1 size-3.5" />
                    View Customer Profile
                  </Link>
                </Button>
              </DetailGroup>
            </>
          ) : (
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
              <p className="text-ash">No customer assigned to this order.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'vehicle' && (
        <div className="space-y-6">
          {order.vehicle ? (
            <>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[10px] border border-iron/30">
                <Image
                  src={order.vehicle.images?.[0]?.imageUrl || '/placeholder-vehicle.jpg'}
                  alt={order.vehicle.title || 'Vehicle'}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <DetailGroup title="Vehicle Information">
                <DetailGrid
                  fields={[
                    { label: 'Title', value: order.vehicle.title || '—' },
                    { label: 'VIN', value: order.vehicle.vin || '—', copyable: true, mono: true },
                    { label: 'Stock Number', value: order.vehicle.stockNumber || '—', copyable: true, mono: true },
                    { label: 'Price', value: order.vehicle.price ? formatPrice(order.vehicle.price) : '—' },
                    { label: 'Status', value: order.vehicle.status || '—' },
                    { label: 'Year', value: order.vehicle.year?.toString() || '—' },
                  ]}
                  columns={3}
                />
              </DetailGroup>
              <DetailGroup title="Actions">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/vehicles/${order.vehicleId}`}>
                    <ExternalLink className="mr-1 size-3.5" />
                    View Vehicle Details
                  </Link>
                </Button>
              </DetailGroup>
            </>
          ) : (
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
              <p className="text-ash">No vehicle assigned to this order.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              variant="compact"
              label="Total Amount"
              value={formatPrice(order.totalAmount)}
              icon="DollarSign"
              color="text-pure-white"
            />
            <StatCard
              variant="compact"
              label="Amount Paid"
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
          </div>

          <DetailGroup title="Payment Status">
            <DetailGrid
              fields={[
                {
                  label: 'Status',
                  value: paymentConfig ? (
                    <StatusChip
                      label={paymentConfig.label}
                      variant={getStatusVariant(order.payments?.[0]?.status || '')}
                    />
                  ) : 'No payment records',
                },
                { label: 'Total Amount', value: formatPrice(order.totalAmount) },
                { label: 'Amount Paid', value: formatPrice(totalPaid) },
                { label: 'Balance Due', value: formatPrice(balance) },
              ]}
              columns={2}
            />
          </DetailGroup>

          {order.payments && order.payments.length > 0 && (
            <DetailGroup title="Payment History">
              <div className="space-y-2">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-iron/20 p-2">
                        <DollarSign className="size-4 text-steel" />
                      </div>
                      <div>
                        <p className="text-sm text-pure-white">
                          {formatPrice(payment.amount, payment.currency)}
                        </p>
                        <p className="text-xs text-steel">
                          {format(new Date(payment.createdAt), 'PPpp')}
                        </p>
                      </div>
                    </div>
                    <StatusChip
                      label={PAYMENT_STATUS_CONFIG[payment.status as PaymentStatus]?.label || payment.status}
                      variant={getStatusVariant(payment.status)}
                    />
                  </div>
                ))}
              </div>
            </DetailGroup>
          )}

          <DetailGroup title="Actions">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Generate Invoice
              </Button>
            </div>
          </DetailGroup>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <OrderInvoices orderId={orderId} order={order} onRefresh={fetchOrder} />
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="space-y-6">
          {order.shipments && order.shipments.length > 0 ? (
            order.shipments.map((shipment) => (
              <div key={shipment.id} className="space-y-4">
                <DetailGroup title="Shipment Information">
                  <DetailGrid
                    fields={[
                      {
                        label: 'Status',
                        value: shipmentConfig ? (
                          <StatusChip
                            label={shipmentConfig.label}
                            variant={getStatusVariant(shipment.status)}
                          />
                        ) : shipment.status || '—',
                      },
                      { label: 'Carrier', value: shipment.carrier || '—' },
                      { label: 'Created', value: format(new Date(shipment.createdAt), 'PPpp') },
                    ]}
                    columns={2}
                  />
                </DetailGroup>
              </div>
            ))
          ) : (
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
              <p className="text-ash">No shipping information available for this order.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <DetailGroup title="Order Documents">
            <OrderDocuments
              orderId={orderId}
              documents={order.documents || []}
              onDocumentsChanged={fetchOrder}
            />
          </DetailGroup>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
          <ActivityTimeline
            activities={activityTimeline}
            emptyMessage="No activity recorded for this order yet."
          />
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-6">
          <DetailGroup title="Notes">
            <OrderNotes
              orderId={orderId}
              notes={order.notes || []}
              onNotesChanged={fetchOrder}
            />
          </DetailGroup>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
          <OrderAuditLog orderId={orderId} />
        </div>
      )}

      <OrderDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        orderId={orderId}
        orderNumber={order.orderNumber}
        onDeleted={() => router.push('/admin/orders')}
      />

      <OrderStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        orderId={orderId}
        currentStatus={order.status as OrderStatus}
        validTransitions={validTransitions}
        onStatusChanged={fetchOrder}
      />
    </div>
  );
}
