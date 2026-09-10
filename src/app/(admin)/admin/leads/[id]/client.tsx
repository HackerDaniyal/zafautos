'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, User, Car, MessageSquare, Clock, Phone,
  Mail, StickyNote, Send, ExternalLink, Loader2,
  CheckCircle, XCircle, ArrowRight, Handshake, AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { getLeadDetail, updateLeadStatus, addLeadNote } from '@/server/actions/leadActions';
import { getEntityAuditTrailAction } from '@/server/actions/auditActions';
import { LEAD_STATUS_CONFIG, LEAD_SOURCE_CONFIG } from '../constants';
import { ConvertToOrderDialog } from '../components/convert-to-order-dialog';
import type { LeadStatus, LeadDetail } from '../types';

interface LeadDetailClientProps {
  leadId: string;
}

export function LeadDetailClient({ leadId }: LeadDetailClientProps) {
  const { toast } = useToast();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [auditTrail, setAuditTrail] = useState<Array<{
    id: string;
    action: string;
    entityLabel?: string | null;
    userId?: string | null;
    metadata?: any;
    createdAt: Date | string;
  }>>([]);

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLeadDetail(leadId);
      if (result.success && result.data) {
        setLead(result.data as LeadDetail);
        // Fetch audit trail
        try {
          const trail = await getEntityAuditTrailAction('lead', leadId);
          if (Array.isArray(trail)) {
            setAuditTrail(trail);
          }
        } catch {
          // Audit trail is non-critical
        }
      } else if (!result.success) {
        setError(result.error || 'Lead not found');
      }
    } catch {
      setError('Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  async function handleStatusChange(newStatus: LeadStatus) {
    if (!lead || changingStatus) return;
    setChangingStatus(true);
    try {
      const result = await updateLeadStatus({ leadId: lead.id, status: newStatus });
      if (result.success) {
        toast({ title: 'Status updated', variant: 'success' });
        fetchLead();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'error' });
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleAddNote() {
    if (!lead || !noteText.trim() || addingNote) return;
    setAddingNote(true);
    try {
      const result = await addLeadNote({ leadId: lead.id, note: noteText.trim() });
      if (result.success) {
        setNoteText('');
        toast({ title: 'Note added', variant: 'success' });
        fetchLead();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'error' });
    } finally {
      setAddingNote(false);
    }
  }

  function handleConverted(orderId: string, orderNumber: string) {
    setConvertDialogOpen(false);
    fetchLead(); // Refresh to show converted status
  }

  function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatPrice(price: number | null | undefined): string {
    if (price == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  }

  // ── Derived state for button logic ──
  const canConvert = lead && lead.status !== 'converted' && lead.status !== 'lost' && lead.vehicle != null;
  const isConverted = lead?.status === 'converted';
  const isLost = lead?.status === 'lost';

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
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[10px] border border-iron/30 bg-carbon p-6">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-48 rounded-[10px]" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-pure-white">Lead not found</p>
        <p className="mt-2 text-sm text-ash">{error || 'The requested lead does not exist.'}</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/admin/leads">
            <ArrowLeft className="mr-1 size-4" />
            Back to Leads
          </Link>
        </Button>
      </div>
    );
  }

  const statusConfig = LEAD_STATUS_CONFIG[lead.status];
  const sourceConfig = LEAD_SOURCE_CONFIG[lead.source] || { label: lead.source };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/admin/leads">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-pure-white">
              {lead.customerName || 'Anonymous Lead'}
            </h1>
            <Badge
              variant="outline"
              className={`${statusConfig.bgColor} ${statusConfig.color} border-transparent`}
            >
              <span className={`mr-1.5 size-1.5 rounded-full ${statusConfig.dotColor}`} />
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-steel ml-10">
            Created {formatDate(lead.createdAt)} · {sourceConfig.label}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Status flow buttons */}
          {!isConverted && !isLost && (
            <>
              {lead.status === 'new' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('contacted')}
                  disabled={changingStatus}
                >
                  <Phone className="mr-1.5 size-3.5" />
                  Mark Contacted
                </Button>
              )}
              {lead.status === 'contacted' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('qualified')}
                  disabled={changingStatus}
                >
                  <CheckCircle className="mr-1.5 size-3.5" />
                  Qualify
                </Button>
              )}
              {lead.status === 'qualified' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('negotiating')}
                  disabled={changingStatus}
                >
                  <Handshake className="mr-1.5 size-3.5" />
                  Start Negotiating
                </Button>
              )}
              {lead.status === 'negotiating' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusChange('lost')}
                  disabled={changingStatus}
                >
                  <XCircle className="mr-1.5 size-3.5" />
                  Mark Lost
                </Button>
              )}

              {/* Convert to Order — opens dialog */}
              <Button
                size="sm"
                onClick={() => setConvertDialogOpen(true)}
                disabled={!canConvert}
                className="bg-signal-red text-pure-white hover:bg-deep-red"
              >
                <ArrowRight className="mr-1.5 size-3.5" />
                Convert to Order
              </Button>
            </>
          )}

          {isConverted && (
            <Badge variant="outline" className="bg-available-green/10 text-available-green border-transparent px-3 py-1.5">
              <CheckCircle className="mr-1.5 size-3.5" />
              Converted
            </Badge>
          )}
          {isLost && (
            <Badge variant="outline" className="bg-signal-red/10 text-signal-red border-transparent px-3 py-1.5">
              <XCircle className="mr-1.5 size-3.5" />
              Lost
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Card */}
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
          <h3 className="text-sm font-medium text-steel mb-4 flex items-center gap-2">
            <User className="size-4" />
            Customer Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-steel">Name</p>
              <p className="text-sm font-medium text-pure-white">{lead.customerName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-steel">Email</p>
              <p className="text-sm text-pure-white">{lead.customerEmail || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-steel">Phone</p>
              <p className="text-sm text-pure-white">{lead.customerPhone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-steel">Country</p>
              <p className="text-sm text-pure-white">{lead.customerCountry || '—'}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {lead.customerEmail && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${lead.customerEmail}`}>
                  <Mail className="mr-1 size-3" />
                  Email
                </a>
              </Button>
            )}
            {lead.customerPhone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${lead.customerPhone}`}>
                  <Phone className="mr-1 size-3" />
                  Call
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Vehicle Card */}
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
          <h3 className="text-sm font-medium text-steel mb-4 flex items-center gap-2">
            <Car className="size-4" />
            Vehicle Information
          </h3>
          {lead.vehicle ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-pure-white">
                  {lead.vehicle.year} {lead.vehicle.make} {lead.vehicle.model}
                </p>
              </div>
              <div>
                <p className="text-xs text-steel">Price</p>
                <p className="text-sm font-medium text-pure-white">{formatPrice(lead.vehicle.price)}</p>
              </div>
              <div>
                <p className="text-xs text-steel">Stock #</p>
                <p className="text-sm font-mono text-pure-white">{lead.vehicle.stockNumber || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-steel">VIN</p>
                <p className="text-sm font-mono text-pure-white">{lead.vehicle.vin || '—'}</p>
              </div>
              {lead.vehicle.imageUrl && (
                <div className="mt-2 relative h-24 w-full rounded-md overflow-hidden bg-deep-carbon">
                  <Image
                    src={lead.vehicle.imageUrl}
                    alt={`${lead.vehicle.year} ${lead.vehicle.make} ${lead.vehicle.model}`}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
              )}
              {lead.vehicle.slug && (
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link href={`/vehicles/${lead.vehicle.slug}`} target="_blank">
                    <ExternalLink className="mr-1 size-3" />
                    View Listing
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-steel">No vehicle associated</p>
          )}
        </div>

        {/* Lead Details Card */}
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
          <h3 className="text-sm font-medium text-steel mb-4 flex items-center gap-2">
            <MessageSquare className="size-4" />
            Lead Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-steel">Source</p>
              <p className="text-sm text-pure-white">{sourceConfig.label}</p>
            </div>
            <div>
              <p className="text-xs text-steel">Created</p>
              <p className="text-sm text-pure-white">{formatDate(lead.createdAt)}</p>
            </div>
            {lead.contactedAt && (
              <div>
                <p className="text-xs text-steel">First Contacted</p>
                <p className="text-sm text-pure-white">{formatDate(lead.contactedAt)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-steel">Assigned To</p>
              <p className="text-sm text-pure-white">{lead.assignedUser?.email || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs text-steel">Status</p>
              <Badge
                variant="outline"
                className={`${statusConfig.bgColor} ${statusConfig.color} border-transparent`}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Original Message */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <h3 className="text-sm font-medium text-steel mb-3">Original Message</h3>
        <div className="rounded-md bg-deep-carbon p-4">
          <pre className="text-sm text-pure-white whitespace-pre-wrap font-sans">
            {lead.message}
          </pre>
        </div>
      </div>

      {/* Internal Notes */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <h3 className="text-sm font-medium text-steel mb-3">Internal Notes</h3>

        {/* Add Note Form */}
        <div className="flex gap-2 mb-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add an internal note..."
            className="flex-1 rounded-md border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            rows={2}
          />
          <Button
            size="sm"
            onClick={handleAddNote}
            disabled={!noteText.trim() || addingNote}
          >
            {addingNote ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>

        {/* Notes List */}
        {lead.notes.length === 0 ? (
          <p className="text-sm text-steel py-4 text-center">No notes yet</p>
        ) : (
          <div className="space-y-3">
            {lead.notes.map((note) => (
              <div
                key={note.id}
                className="rounded-md bg-deep-carbon p-3"
              >
                <p className="text-sm text-pure-white whitespace-pre-wrap">{note.note}</p>
                <p className="text-xs text-steel mt-2">
                  {note.createdByUser?.email || 'Unknown'} · {formatDate(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Trail */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <h3 className="text-sm font-medium text-steel mb-3 flex items-center gap-2">
          <ShieldCheck className="size-4" />
          Activity Trail
        </h3>
        <div className="space-y-2">
          {/* Lead created — always first */}
          <div className="flex items-center gap-3 text-sm">
            <div className="size-2 rounded-full bg-blue-400" />
            <span className="text-pure-white">Lead created</span>
            <span className="text-steel text-xs ml-auto">{formatDate(lead.createdAt)}</span>
          </div>

          {/* Real audit entries from DB */}
          {auditTrail.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 text-sm">
              <div className={`size-2 rounded-full ${
                entry.action.includes('converted') ? 'bg-available-green' :
                entry.action.includes('lost') ? 'bg-signal-red' :
                entry.action.includes('contacted') ? 'bg-auction-amber' :
                entry.action.includes('note') ? 'bg-purple-400' :
                entry.action.includes('assigned') ? 'bg-cyan-400' :
                'bg-steel'
              }`} />
              <span className="text-pure-white">
                {entry.action === 'lead.converted_to_order' && `Converted to order ${entry.entityLabel || ''}`}
                {entry.action === 'lead.status_changed' && `Status changed: ${entry.metadata?.from} → ${entry.metadata?.to}`}
                {entry.action === 'lead.note_added' && 'Internal note added'}
                {entry.action === 'lead.assigned' && 'Assigned to staff'}
                {!['lead.converted_to_order', 'lead.status_changed', 'lead.note_added', 'lead.assigned'].includes(entry.action) && entry.action}
              </span>
              <span className="text-steel text-xs ml-auto">{formatDate(entry.createdAt)}</span>
            </div>
          ))}

          {/* Empty state */}
          {auditTrail.length === 0 && (
            <p className="text-xs text-steel py-2">No additional activity recorded</p>
          )}
        </div>
      </div>

      {/* Convert to Order Dialog */}
      {lead.vehicle && (
        <ConvertToOrderDialog
          open={convertDialogOpen}
          onOpenChange={setConvertDialogOpen}
          lead={{
            id: lead.id,
            customerName: lead.customerName,
            customerEmail: lead.customerEmail,
            customerPhone: lead.customerPhone,
            vehicle: lead.vehicle,
          }}
          onConverted={handleConverted}
        />
      )}
    </div>
  );
}
