'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trash2,
  Truck,
  Package,
  MapPin,
  FileText,
  StickyNote,
  Eye,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  getShipment,
  changeShipmentStatus,
  addShipmentNote,
  addShipmentDocument,
  deleteShipmentDocument,
  addShipmentContainer,
  deleteShipmentContainer,
  deleteShipment,
} from '@/server/actions/shippingActions';
import {
  SHIPMENT_STATUS_CONFIG,
  SHIPMENT_STATUS_OPTIONS,
} from '../constants';
import {
  type ShipmentDetail,
  type ShipmentStatus,
  SHIPPING_STATUS_TRANSITIONS,
} from '../types';

type Tab = 'overview' | 'containers' | 'tracking' | 'documents' | 'notes';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'containers', label: 'Containers', icon: Package },
  { id: 'tracking', label: 'Tracking', icon: MapPin },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote },
];

interface ShipmentDetailClientProps {
  shipmentId: string;
}

export function ShipmentDetailClient({ shipmentId }: ShipmentDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [containerNumber, setContainerNumber] = useState('');
  const [addingContainer, setAddingContainer] = useState(false);

  const [trackingNote, setTrackingNote] = useState('');
  const [addingTracking, setAddingTracking] = useState(false);

  const [documentUrl, setDocumentUrl] = useState('');
  const [addingDocument, setAddingDocument] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const fetchShipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getShipment(shipmentId);
      if (result.success && result.data) {
        setShipment(result.data as ShipmentDetail);
      } else if (!result.success) {
        setError(result.error || 'Shipment not found');
      }
    } catch {
      setError('Failed to load shipment');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  async function handleStatusChange() {
    if (!newStatus || newStatus === shipment?.status) return;
    setChangingStatus(true);
    try {
      const result = await changeShipmentStatus(shipmentId, newStatus, statusNote || undefined);
      if (result.success) {
        toast({ title: 'Status updated', description: 'Shipment status has been updated.', variant: 'default' });
        setStatusDialogOpen(false);
        setNewStatus('');
        setStatusNote('');
        await fetchShipment();
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
      const result = await deleteShipment(shipmentId);
      if (result.success) {
        toast({ title: 'Deleted', description: 'Shipment has been deleted.', variant: 'default' });
        router.push('/admin/shipping');
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete shipment', variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  async function handleAddContainer() {
    if (!containerNumber.trim()) return;
    setAddingContainer(true);
    try {
      const result = await addShipmentContainer(shipmentId, containerNumber.trim());
      if (result.success) {
        toast({ title: 'Container added', variant: 'default' });
        setContainerNumber('');
        await fetchShipment();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add container', variant: 'error' });
    } finally {
      setAddingContainer(false);
    }
  }

  async function handleDeleteContainer(containerId: string) {
    try {
      const result = await deleteShipmentContainer(containerId);
      if (result.success) {
        toast({ title: 'Container removed', variant: 'default' });
        await fetchShipment();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove container', variant: 'error' });
    }
  }

  async function handleAddTrackingEvent() {
    if (!trackingNote.trim()) return;
    setAddingTracking(true);
    try {
      const result = await addShipmentNote(shipmentId, trackingNote.trim());
      if (result.success) {
        toast({ title: 'Tracking event added', variant: 'default' });
        setTrackingNote('');
        await fetchShipment();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add tracking event', variant: 'error' });
    } finally {
      setAddingTracking(false);
    }
  }

  async function handleAddDocument() {
    if (!documentUrl.trim()) return;
    setAddingDocument(true);
    try {
      const result = await addShipmentDocument(shipmentId, documentUrl.trim());
      if (result.success) {
        toast({ title: 'Document added', variant: 'default' });
        setDocumentUrl('');
        await fetchShipment();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add document', variant: 'error' });
    } finally {
      setAddingDocument(false);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    try {
      const result = await deleteShipmentDocument(documentId);
      if (result.success) {
        toast({ title: 'Document removed', variant: 'default' });
        await fetchShipment();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove document', variant: 'error' });
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const result = await addShipmentNote(shipmentId, noteText.trim());
      if (result.success) {
        toast({ title: 'Note added', variant: 'default' });
        setNoteText('');
        await fetchShipment();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'error' });
    } finally {
      setAddingNote(false);
    }
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
        <div className="flex items-center gap-1 border-b border-iron/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-24 animate-pulse rounded bg-surface-2" />
          ))}
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

  if (error || !shipment) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-pure-white">Shipment not found</p>
        <p className="mt-2 text-sm text-ash">{error || 'The requested shipment does not exist.'}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/shipping">
            <ArrowLeft className="mr-2 size-4" />
            Back to Shipping
          </Link>
        </Button>
      </div>
    );
  }

  const statusConfig = SHIPMENT_STATUS_CONFIG[shipment.status as ShipmentStatus];
  const validTransitions = SHIPPING_STATUS_TRANSITIONS[shipment.status as ShipmentStatus] || [];

  const trackingTimeline: TimelineActivity[] = [
    ...(shipment.tracking || []).map((event) => ({
      id: event.id,
      type: 'updated' as const,
      actor: { name: 'System', email: 'system@zafautos.com' },
      target: {
        type: 'tracking',
        name: event.location || event.note || 'Tracking Update',
        id: event.id,
      },
      details: {
        ...(event.location ? { location: event.location } : {}),
        ...(event.note ? { note: event.note } : {}),
      },
      timestamp: event.createdAt,
    })),
    {
      id: 'created',
      type: 'created' as const,
      actor: { name: 'System', email: 'system@zafautos.com' },
      target: { type: 'shipment', name: `Shipment ${shipment.id.slice(0, 8)}`, id: shipment.id },
      timestamp: shipment.createdAt,
    },
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const notes = (shipment.tracking || []).filter(
    (event) => event.note && !event.location
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
              Shipment {shipment.id.slice(0, 8)}
            </h1>
            <StatusChip
              label={statusConfig?.label || shipment.status}
              variant={getStatusVariant(shipment.status)}
            />
          </div>
          <p className="text-sm text-ash">
            {shipment.carrier && <span>Carrier: {shipment.carrier}</span>}
            {shipment.carrier && ' · '}
            Created {formatDate(shipment.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/shipping">
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
            title="Delete shipment"
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
                  <StatusChip
                    label={statusConfig?.label || shipment.status}
                    variant={getStatusVariant(shipment.status)}
                  />
                </div>
                <div className="rounded-[6px] bg-iron/20 p-2">
                  <Truck className="size-4 text-steel" />
                </div>
              </div>
            </div>
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-steel">Carrier</p>
                  <p className="text-xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
                    {shipment.carrier || '—'}
                  </p>
                </div>
                <div className="rounded-[6px] bg-iron/20 p-2">
                  <Truck className="size-4 text-steel" />
                </div>
              </div>
            </div>
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-steel">Containers</p>
                  <p className="text-xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
                    {shipment.containers?.length || 0}
                  </p>
                </div>
                <div className="rounded-[6px] bg-iron/20 p-2">
                  <Package className="size-4 text-steel" />
                </div>
              </div>
            </div>
            <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-steel">Tracking Events</p>
                  <p className="text-xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
                    {shipment.tracking?.length || 0}
                  </p>
                </div>
                <div className="rounded-[6px] bg-iron/20 p-2">
                  <MapPin className="size-4 text-steel" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DetailGroup title="Order Info">
              <DetailGrid
                fields={[
                  {
                    label: 'Order #',
                    value: shipment.order ? (
                      <Link
                        href={`/admin/orders/${shipment.order.id}`}
                        className="text-link-blue hover:underline"
                      >
                        {shipment.order.orderNumber}
                        <ExternalLink className="ml-1 inline size-3" />
                      </Link>
                    ) : '—',
                  },
                  { label: 'Order Status', value: shipment.order?.status || '—' },
                  { label: 'Customer', value: shipment.customer?.displayName || '—' },
                  { label: 'Dealer', value: shipment.dealer?.displayName || '—' },
                ]}
                columns={2}
              />
            </DetailGroup>

            <DetailGroup title="Vehicle Info">
              <DetailGrid
                fields={[
                  {
                    label: 'Vehicle',
                    value: shipment.vehicle
                      ? `${shipment.vehicle.year || ''} Vehicle`.trim()
                      : '—',
                  },
                  { label: 'VIN', value: shipment.vehicle?.vin || '—', mono: true },
                  { label: 'Stock Number', value: shipment.vehicle?.stockNumber || '—', mono: true },
                ]}
                columns={2}
              />
            </DetailGroup>
          </div>
        </div>
      )}

      {activeTab === 'containers' && (
        <div className="space-y-6">
          <SectionHeader
            title="Containers"
            description={`${shipment.containers?.length || 0} container(s) attached`}
            action={
              <Button size="sm" onClick={() => document.getElementById('add-container-input')?.focus()}>
                <Plus className="mr-1 size-4" />
                Add Container
              </Button>
            }
          />

          {shipment.containers && shipment.containers.length > 0 ? (
            <div className="space-y-2">
              {shipment.containers.map((container) => (
                <div
                  key={container.id}
                  className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-iron/20 p-2">
                      <Package className="size-4 text-steel" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-pure-white">
                        {container.containerNumber}
                      </p>
                      <p className="text-xs text-steel">
                        Added {formatDate(container.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteContainer(container.id)}
                    title="Remove container"
                  >
                    <Trash2 className="size-4 text-signal-red" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No containers"
              description="No containers have been added to this shipment yet."
              icon={Package}
            />
          )}

          <div className="flex gap-2">
            <Input
              id="add-container-input"
              placeholder="Container number"
              value={containerNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContainerNumber(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleAddContainer();
              }}
              className="flex-1"
            />
            <Button
              onClick={handleAddContainer}
              disabled={!containerNumber.trim() || addingContainer}
            >
              {addingContainer ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <SectionHeader
            title="Tracking Events"
            description={`${shipment.tracking?.length || 0} event(s) recorded`}
          />

          <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
            <ActivityTimeline
              activities={trackingTimeline}
              emptyMessage="No tracking events recorded for this shipment yet."
            />
          </div>

          <DetailGroup title="Add Tracking Event">
            <div className="space-y-3">
              <textarea
                value={trackingNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTrackingNote(e.target.value)}
                placeholder="Note"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
                rows={2}
              />
              <Button
                onClick={handleAddTrackingEvent}
                disabled={!trackingNote.trim() || addingTracking}
                size="sm"
              >
                {addingTracking ? 'Adding...' : 'Add Event'}
              </Button>
            </div>
          </DetailGroup>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <SectionHeader
            title="Documents"
            description={`${shipment.documents?.length || 0} document(s) attached`}
          />

          {shipment.documents && shipment.documents.length > 0 ? (
            <div className="space-y-2">
              {shipment.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-iron/20 p-2">
                      <FileText className="size-4 text-steel" />
                    </div>
                    <div className="min-w-0">
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-link-blue hover:underline truncate block"
                      >
                        {doc.documentUrl}
                      </a>
                      <p className="text-xs text-steel">
                        Added {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteDocument(doc.id)}
                    title="Remove document"
                  >
                    <Trash2 className="size-4 text-signal-red" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No documents"
              description="No documents have been attached to this shipment yet."
              icon={FileText}
            />
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Document URL"
              value={documentUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumentUrl(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleAddDocument();
              }}
              className="flex-1"
            />
            <Button
              onClick={handleAddDocument}
              disabled={!documentUrl.trim() || addingDocument}
            >
              {addingDocument ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-6">
          <SectionHeader title="Notes" description="Notes and comments for this shipment" />

          <DetailGroup title="Add Note">
            <div className="space-y-3">
              <textarea
                value={noteText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteText(e.target.value)}
                placeholder="Write a note..."
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
                rows={3}
              />
              <Button
                onClick={handleAddNote}
                disabled={!noteText.trim() || addingNote}
                size="sm"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </DetailGroup>

          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4"
                >
                  <p className="text-sm text-pure-white whitespace-pre-wrap">{note.note}</p>
                  <p className="mt-2 text-xs text-steel">{formatDate(note.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No notes"
              description="No notes have been added to this shipment yet."
              icon={StickyNote}
            />
          )}
        </div>
      )}

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="bg-carbon border-iron">
          <DialogHeader>
            <DialogTitle className="text-pure-white">Change Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-ash">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-deep-carbon border-iron/30 text-pure-white">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent className="bg-carbon border-iron">
                  {SHIPMENT_STATUS_OPTIONS.filter(
                    (opt) => validTransitions.includes(opt.value as ShipmentStatus)
                  ).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ash">Note (optional)</label>
              <textarea
                value={statusNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStatusNote(e.target.value)}
                placeholder="Reason for status change..."
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!newStatus || newStatus === shipment.status || changingStatus}
            >
              {changingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-carbon border-iron">
          <DialogHeader>
            <DialogTitle className="text-pure-white">Delete Shipment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ash py-4">
            Are you sure you want to delete this shipment? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
