'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Trash2, User, ShoppingCart, CreditCard, Truck, FileText,
  StickyNote, Eye, Package, MapPin, Clock, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusChip, getStatusVariant } from '@/components/admin/ui/status-chip';
import { DetailGroup, DetailGrid } from '@/components/admin/drawer/detail-sections';
import { ActivityTimeline } from '@/components/admin/timeline/activity-timeline';
import type { TimelineActivity } from '@/components/admin/timeline/timeline-entry';
import { SectionHeader } from '@/components/admin/ui/section-header';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { useToast } from '@/components/admin/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/cms/dates';
import {
  getCustomer, changeCustomerStatus, deleteCustomer,
} from '@/server/actions/customerActions';
import { CUSTOMER_STATUS_CONFIG, CUSTOMER_STATUS_OPTIONS } from '../constants';
import { CUSTOMER_STATUS_TRANSITIONS, type CustomerDetail, type CustomerStatus } from '../types';

type Tab = 'overview' | 'orders' | 'payments' | 'shipments' | 'wishlist' | 'documents' | 'notes' | 'addresses' | 'timeline' | 'audit';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'shipments', label: 'Shipments', icon: Truck },
  { id: 'wishlist', label: 'Wishlist', icon: Package },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'audit', label: 'Audit Log', icon: Shield },
];

interface CustomerDetailClientProps {
  customerId: string;
}

export function CustomerDetailClient({ customerId }: CustomerDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCustomer(customerId);
      if (result.success && result.data) {
        setCustomer(result.data as CustomerDetail);
      } else if (!result.success) {
        setError(result.error || 'Customer not found');
      }
    } catch {
      setError('Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  async function handleStatusChange() {
    if (!newStatus || newStatus === customer?.status) return;
    setChangingStatus(true);
    try {
      const result = await changeCustomerStatus(customerId, newStatus, statusNote || undefined);
      if (result.success) {
        toast({ title: 'Status updated', description: 'Customer status has been updated.', variant: 'default' });
        setStatusDialogOpen(false);
        setNewStatus('');
        setStatusNote('');
        await fetchCustomer();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to change status', variant: 'error' });
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteCustomer(customerId);
      if (result.success) {
        toast({ title: 'Deleted', description: 'Customer has been deleted.', variant: 'default' });
        router.push('/admin/customers');
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  function formatCurrency(amount: number | null | undefined): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded bg-surface-2" />
            <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 animate-pulse rounded bg-surface-2" />
            <div className="h-9 w-20 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[10px] bg-surface-2" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-[10px] bg-surface-2" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-pure-white">Customer not found</p>
        <p className="mt-2 text-sm text-ash">{error || 'The requested customer does not exist.'}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/customers">
            <ArrowLeft className="mr-2 size-4" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  const customerStatus = (customer.status || 'active') as CustomerStatus;
  const statusConfig = CUSTOMER_STATUS_CONFIG[customerStatus];
  const validTransitions = CUSTOMER_STATUS_TRANSITIONS[customerStatus] || [];

  const displayName = customer.displayName || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—';

  const totalPaid = customer.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  const activityTimeline: TimelineActivity[] = [
    ...(customer.orders || []).map((order) => ({
      id: order.id,
      type: 'created' as const,
      actor: { name: 'System', email: 'system@zafautos.com' },
      target: { type: 'order', name: `Order ${order.orderNumber}`, id: order.id },
      timestamp: order.createdAt,
    })),
    {
      id: 'created',
      type: 'created' as const,
      actor: { name: 'System', email: 'system@zafautos.com' },
      target: { type: 'customer', name: displayName, id: customer.id },
      timestamp: customer.createdAt,
    },
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
              {displayName}
            </h1>
            <StatusChip
              label={statusConfig?.label || customerStatus}
              variant={getStatusVariant(customerStatus)}
            />
          </div>
          <p className="text-sm text-ash">
            {customer.email}
            {customer.phone && ` · ${customer.phone}`}
            {` · Created ${formatDate(customer.createdAt)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/customers">
              <ArrowLeft className="mr-1 size-4" />
              Back
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setNewStatus('');
              setStatusNote('');
              setStatusDialogOpen(true);
            }}
            disabled={validTransitions.length === 0}
          >
            Change Status
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeleteDialogOpen(true)}
            title="Delete customer"
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
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-steel">Status</p>
                  <StatusChip label={statusConfig?.label || customerStatus} variant={getStatusVariant(customerStatus)} />
                </div>
                <div className="rounded-[6px] bg-iron/20 p-2">
                  <User className="size-4 text-steel" />
                </div>
              </div>
            </div>
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-steel">Total Orders</p>
                  <p className="text-xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
                    {customer.orders?.length || 0}
                  </p>
                </div>
                <div className="rounded-[6px] bg-iron/20 p-2">
                  <ShoppingCart className="size-4 text-steel" />
                </div>
              </div>
            </div>
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-steel">Total Spent</p>
                  <p className="text-xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
                    {formatCurrency(customer.orders?.reduce((sum, o) => sum + (o.totalAmount || 0), 0))}
                  </p>
                </div>
                <div className="rounded-[6px] bg-iron/20 p-2">
                  <CreditCard className="size-4 text-steel" />
                </div>
              </div>
            </div>
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-steel">Wishlist</p>
                  <p className="text-xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
                    {customer.wishlist?.length || 0}
                  </p>
                </div>
                <div className="rounded-[6px] bg-iron/20 p-2">
                  <Package className="size-4 text-steel" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DetailGroup title="Personal Information">
              <DetailGrid
                fields={[
                  { label: 'Name', value: displayName },
                  { label: 'Email', value: customer.email },
                  { label: 'Phone', value: customer.phone || '—' },
                  { label: 'Status', value: statusConfig?.label || customerStatus },
                ]}
                columns={2}
              />
            </DetailGroup>

            <DetailGroup title="Account Details">
              <DetailGrid
                fields={[
                  { label: 'Customer ID', value: customer.id, mono: true },
                  { label: 'Created', value: formatDate(customer.createdAt) },
                  { label: 'Updated', value: formatDate(customer.updatedAt) },
                  { label: 'Addresses', value: `${customer.addresses?.length || 0} saved` },
                ]}
                columns={2}
              />
            </DetailGroup>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <SectionHeader title="Orders" description={`${customer.orders?.length || 0} order(s)`} />
          {customer.orders && customer.orders.length > 0 ? (
            <div className="space-y-2">
              {customer.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-iron/20 p-2">
                      <ShoppingCart className="size-4 text-steel" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-pure-white">{order.orderNumber}</p>
                      <p className="text-xs text-steel">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-pure-white">{formatCurrency(order.totalAmount)}</span>
                    <Badge variant="outline" className="text-xs">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No orders" description="This customer has no orders yet." icon={ShoppingCart} />
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <SectionHeader title="Payments" description={`${customer.payments?.length || 0} payment(s)`} />
          {customer.payments && customer.payments.length > 0 ? (
            <div className="space-y-2">
              {customer.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-iron/20 p-2">
                      <CreditCard className="size-4 text-steel" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-pure-white">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-steel">{formatDate(payment.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{payment.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No payments" description="No payment records found." icon={CreditCard} />
          )}
        </div>
      )}

      {activeTab === 'shipments' && (
        <div className="space-6">
          <SectionHeader title="Shipments" description={`${customer.shipments?.length || 0} shipment(s)`} />
          {customer.shipments && customer.shipments.length > 0 ? (
            <div className="space-y-2">
              {customer.shipments.map((shipment) => (
                <div key={shipment.id} className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-iron/20 p-2">
                      <Truck className="size-4 text-steel" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-pure-white">{shipment.carrier || '—'}</p>
                      <p className="text-xs text-steel">{formatDate(shipment.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{shipment.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No shipments" description="No shipments found." icon={Truck} />
          )}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <SectionHeader title="Wishlist" description={`${customer.wishlist?.length || 0} vehicle(s)`} />
          {customer.wishlist && customer.wishlist.length > 0 ? (
            <div className="space-y-2">
              {customer.wishlist.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-iron/20 p-2">
                      <Package className="size-4 text-steel" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-pure-white">Vehicle {item.vehicleId.slice(0, 8)}</p>
                      <p className="text-xs text-steel">Added {formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No wishlist items" description="This customer has no vehicles in their wishlist." icon={Package} />
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <SectionHeader title="Documents" description={`${customer.documents?.length || 0} document(s)`} />
          {customer.documents && customer.documents.length > 0 ? (
            <div className="space-y-2">
              {customer.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-iron/20 p-2">
                      <FileText className="size-4 text-steel" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-pure-white">{doc.title}</p>
                      <p className="text-xs text-steel">{formatDate(doc.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No documents" description="No documents uploaded." icon={FileText} />
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-6">
          <SectionHeader title="Notes" description="Customer alerts and notes" />
          {customer.alerts && customer.alerts.length > 0 ? (
            <div className="space-y-2">
              {customer.alerts.map((alert) => (
                <div key={alert.id} className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4">
                  <p className="text-sm text-pure-white whitespace-pre-wrap">{alert.message}</p>
                  <p className="mt-2 text-xs text-steel">{formatDate(alert.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No notes" description="No notes have been added." icon={StickyNote} />
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <SectionHeader title="Addresses" description={`${customer.addresses?.length || 0} address(es)`} />
          {customer.addresses && customer.addresses.length > 0 ? (
            <div className="space-y-2">
              {customer.addresses.map((addr) => (
                <div key={addr.id} className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4">
                  <p className="text-sm text-pure-white">{addr.addressLine || '—'}</p>
                  <p className="text-xs text-steel">{[addr.city, addr.country, addr.postalCode].filter(Boolean).join(', ') || '—'}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No addresses" description="No addresses saved." icon={MapPin} />
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
          <ActivityTimeline activities={activityTimeline} emptyMessage="No activity recorded for this customer yet." />
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
          <SectionHeader title="Audit Log" description="Audit trail for this customer" />
          <div className="mt-4 text-sm text-ash">Audit log integration via existing audit infrastructure.</div>
        </div>
      )}

      {/* Status Change Dialog */}
      {statusDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-[10px] border border-iron bg-carbon p-6">
            <h3 className="text-lg font-semibold text-pure-white">Change Status</h3>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm text-ash">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white focus:outline-none focus:ring-1 focus:ring-signal-red"
                >
                  <option value="">Select status...</option>
                  {CUSTOMER_STATUS_OPTIONS.filter((opt) => validTransitions.includes(opt.value as CustomerStatus)).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-ash">Note (optional)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Reason for status change..."
                  className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleStatusChange} disabled={!newStatus || newStatus === customer.status || changingStatus}>
                {changingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-[10px] border border-iron bg-carbon p-6">
            <h3 className="text-lg font-semibold text-pure-white">Delete Customer</h3>
            <p className="text-sm text-ash py-4">Are you sure you want to delete this customer? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
