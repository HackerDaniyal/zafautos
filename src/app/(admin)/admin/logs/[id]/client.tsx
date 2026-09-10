'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Copy, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAuditLog } from '@/server/actions/auditActions';
import { getActionLabel, getActionCategory } from '@/lib/audit/action-labels';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  userId: string | null;
  changes: unknown;
  metadata: unknown;
  createdAt: Date;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  Vehicle: 'bg-blue-500/10 text-blue-400',
  Order: 'bg-amber-500/10 text-amber-400',
  Payment: 'bg-green-500/10 text-green-400',
  Role: 'bg-purple-500/10 text-purple-400',
  'Reference Data': 'bg-cyan-500/10 text-cyan-400',
  Settings: 'bg-orange-500/10 text-orange-400',
  Media: 'bg-pink-500/10 text-pink-400',
  Other: 'bg-steel/10 text-steel',
};

const SENSITIVE_FIELDS = new Set([
  'password', 'secret', 'token', 'apiKey', 'api_key', 'access_token',
  'refresh_token', 'authorization', 'creditCard', 'credit_card', 'cvv',
  'ssn', 'taxId', 'tax_id', 'private_key', 'privateKey',
]);

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_FIELDS.has(key.toLowerCase())) return '[REDACTED]';
  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = sanitizeValue(key, value);
  }
  return result;
}

function formatUser(firstName: string | null, lastName: string | null, email: string | null): string {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return name || email || 'System';
}

function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1 text-xs text-steel hover:text-pure-white">
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function JsonDisplay({ label, data }: { label: string; data: unknown }) {
  if (!data || (typeof data === 'object' && Object.keys(data as object).length === 0)) {
    return null;
  }
  const sanitized = typeof data === 'object' && data !== null
    ? sanitizeObject(data as Record<string, unknown>)
    : data;
  return (
    <div className="rounded-[10px] border border-iron/30 bg-carbon overflow-hidden">
      <div className="flex items-center justify-between border-b border-iron/20 px-4 py-2">
        <h3 className="text-sm font-medium text-pure-white">{label}</h3>
        <CopyButton text={JSON.stringify(sanitized, null, 2)} />
      </div>
      <pre className="p-4 text-xs text-ash overflow-x-auto max-h-96">
        {JSON.stringify(sanitized, null, 2)}
      </pre>
    </div>
  );
}

function ChangeDiff({ changes }: { changes: Record<string, { old: unknown; new: unknown }> }) {
  const entries = Object.entries(changes);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-[10px] border border-iron/30 bg-carbon overflow-hidden">
      <div className="border-b border-iron/20 px-4 py-2">
        <h3 className="text-sm font-medium text-pure-white">Changes</h3>
      </div>
      <div className="divide-y divide-iron/10">
        {entries.map(([field, { old: oldVal, new: newVal }]) => {
          const isSensitive = SENSITIVE_FIELDS.has(field.toLowerCase());
          return (
            <div key={field} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-pure-white">{field}</span>
                {isSensitive && (
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">SENSITIVE</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-destructive/5 px-3 py-2 font-mono text-destructive/80 break-all">
                  <span className="text-[10px] text-steel block mb-1">OLD</span>
                  {isSensitive ? '[REDACTED]' : String(oldVal ?? 'null')}
                </div>
                <div className="rounded bg-available-green/5 px-3 py-2 font-mono text-available-green/80 break-all">
                  <span className="text-[10px] text-steel block mb-1">NEW</span>
                  {isSensitive ? '[REDACTED]' : String(newVal ?? 'null')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AuditLogDetailClient({ logId }: { logId: string }) {
  const [entry, setEntry] = useState<AuditLogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntry = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLog(logId);
      if (result.success) {
        setEntry(result.data as AuditLogEntry);
      } else {
        setError(result.error ?? 'Not found');
      }
    } catch {
      setError('Failed to load audit log entry');
    } finally {
      setLoading(false);
    }
  }, [logId]);

  useEffect(() => { fetchEntry(); }, [fetchEntry]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-steel" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">{error ?? 'Entry not found'}</p>
      </div>
    );
  }

  const category = getActionCategory(entry.action);
  const changes = entry.changes as Record<string, { old: unknown; new: unknown }> | null;
  const metadata = entry.metadata as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={cn(
                'inline-flex rounded px-2.5 py-1 text-xs font-medium',
                CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other,
              )}>
                {getActionLabel(entry.action)}
              </span>
              <span className="text-xs text-steel font-mono">{entry.action}</span>
            </div>
            <div className="text-xs text-steel">
              <span className="font-mono">{entry.entityType}</span>
              <span className="mx-2">·</span>
              <span className="font-mono">{entry.entityId}</span>
            </div>
            {entry.entityLabel && (
              <p className="text-sm text-pure-white">{entry.entityLabel}</p>
            )}
          </div>
        </div>
      </div>

      {/* User + Timestamp */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
          <h3 className="text-xs text-steel uppercase mb-2">Performed By</h3>
          <p className="text-sm text-pure-white">
            {formatUser(entry.userFirstName, entry.userLastName, entry.userEmail)}
          </p>
          {entry.userEmail && (
            <p className="text-xs text-steel mt-1">{entry.userEmail}</p>
          )}
        </div>
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
          <h3 className="text-xs text-steel uppercase mb-2">Timestamp</h3>
          <p className="text-sm text-pure-white">{formatTime(entry.createdAt)}</p>
          <p className="text-xs text-steel mt-1 font-mono">{entry.id}</p>
        </div>
      </div>

      {/* Changes */}
      {changes && <ChangeDiff changes={changes} />}

      {/* Metadata */}
      {metadata && <JsonDisplay label="Metadata" data={metadata} />}
    </div>
  );
}
