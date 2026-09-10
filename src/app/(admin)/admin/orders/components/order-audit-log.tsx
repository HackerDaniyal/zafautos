'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, ArrowRightLeft } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { getEntityAuditTrailAction } from '@/server/actions/auditActions';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  userId?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface OrderAuditLogProps {
  orderId: string;
}

const actionLabels: Record<string, string> = {
  'order.status_changed': 'Status Changed',
  'order.note_added': 'Note Added',
  'order.document_added': 'Document Added',
  'order.soft_deleted': 'Order Deleted',
  'order.restored': 'Order Restored',
  'order.dealer_assigned': 'Dealer Assigned',
  'order.created': 'Order Created',
  'order.updated': 'Order Updated',
};

export function OrderAuditLog({ orderId }: OrderAuditLogProps) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEntityAuditTrailAction('order', orderId);
      if (Array.isArray(result)) {
        setLogs(result.map((r: Record<string, unknown>) => ({
          ...r,
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        })) as AuditLogEntry[]);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load audit log', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-[6px]" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="No audit entries"
        description="No audit trail entries exist for this order."
        icon={Shield}
      />
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const label = actionLabels[log.action] ?? log.action;
        return (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-[6px] border border-iron/30 bg-deep-carbon p-4"
          >
            <div className="rounded-full bg-iron/20 p-2 shrink-0">
              <ArrowRightLeft className="size-4 text-steel" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-pure-white">{label}</p>
              {log.changes && typeof log.changes === 'object' && (
                <div className="mt-1.5 space-y-1">
                  {Object.entries(log.changes as Record<string, unknown>).map(([key, value]) => {
                    const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
                    if (value && typeof value === 'object' && 'old' in value && 'new' in value) {
                      const change = value as { old: unknown; new: unknown };
                      return (
                        <p key={key} className="text-xs text-ash">
                          {displayKey}: {String(change.old ?? '—')} → {String(change.new ?? '—')}
                        </p>
                      );
                    }
                    return (
                      <p key={key} className="text-xs text-ash">
                        {displayKey}: {String(value ?? '—')}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-steel" title={format(new Date(log.createdAt), 'PPpp')}>
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
