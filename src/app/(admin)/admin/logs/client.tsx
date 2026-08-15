'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, ChevronRight, Search, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { listAuditLogs } from '@/server/actions/auditActions';
import {
  getActionLabel,
  getActionCategory,
  ENTITY_TYPES,
  ACTION_CATEGORIES,
  getAllActions,
  getActionsByCategory,
} from '@/lib/audit/action-labels';

interface AuditLogRow {
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

interface AuditListResult {
  data: AuditLogRow[];
  total: number;
  page: number;
  limit: number;
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

function sanitizeChanges(changes: unknown): Record<string, { old: unknown; new: unknown }> | null {
  if (!changes || typeof changes !== 'object') return null;
  const obj = changes as Record<string, { old: unknown; new: unknown }>;
  const sanitized: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = { old: '[REDACTED]', new: '[REDACTED]' };
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function sanitizeMetadata(metadata: unknown): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const obj = metadata as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatUser(firstName: string | null, lastName: string | null, email: string | null): string {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return name || email || 'System';
}

function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ChangesSummary({ changes }: { changes: unknown }) {
  const sanitized = sanitizeChanges(changes);
  if (!sanitized) return <span className="text-xs text-steel">—</span>;
  const keys = Object.keys(sanitized);
  if (keys.length === 0) return <span className="text-xs text-steel">—</span>;
  return (
    <span className="text-xs text-ash">
      {keys.length} field{keys.length !== 1 ? 's' : ''} changed
    </span>
  );
}

export function AuditLogListClient() {
  const router = useRouter();
  const [data, setData] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const allActions = getAllActions();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAuditLogs(
        {
          entityType: entityType || undefined,
          action: action || undefined,
          search: search || undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined,
        },
        page,
        limit,
      );
      if (result.success) {
        const r = result.data as AuditListResult;
        setData(r.data);
        setTotal(r.total);
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to load audit logs' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load audit logs' });
    } finally {
      setLoading(false);
    }
  }, [entityType, action, search, dateFrom, dateTo, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function handleClearFilters() {
    setEntityType('');
    setAction('');
    setSearchInput('');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);
  const hasFilters = entityType || action || search || dateFrom || dateTo;

  return (
    <>
      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            'rounded-[6px] px-4 py-2 text-sm',
            feedback.type === 'success'
              ? 'bg-available-green/10 text-available-green'
              : 'bg-destructive/10 text-destructive'
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3 rounded-[10px] border border-iron/30 bg-carbon p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-pure-white">Filters</h3>
          {hasFilters && (
            <button onClick={handleClearFilters} className="text-xs text-steel hover:text-pure-white">
              Clear all
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Entity Type */}
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            className="h-9 rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white focus-visible:border-signal-red outline-none"
          >
            <option value="">All entity types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>

          {/* Action */}
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="h-9 rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white focus-visible:border-signal-red outline-none"
          >
            <option value="">All actions</option>
            {ACTION_CATEGORIES.map((cat) => {
              const actions = getActionsByCategory(cat);
              if (actions.length === 0) return null;
              return (
                <optgroup key={cat} label={cat}>
                  {actions.map((a) => (
                    <option key={a} value={a}>{getActionLabel(a)}</option>
                  ))}
                </optgroup>
              );
            })}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white focus-visible:border-signal-red outline-none"
            placeholder="From date"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white focus-visible:border-signal-red outline-none"
            placeholder="To date"
          />
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search by entity label..."
              className="pl-9"
            />
          </div>
          <Button size="sm" onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-ash">
        <span>{total} entr{total !== 1 ? 'ies' : 'y'}</span>
        {hasFilters && <span className="text-xs text-steel">Filtered</span>}
      </div>

      {/* Table */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-iron/30 text-left text-xs text-steel uppercase tracking-wider">
                <th className="px-4 py-3 w-40">Time</th>
                <th className="px-4 py-3 w-44">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3 w-28">Entity</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-steel" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-steel">
                    No audit log entries found.
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const category = getActionCategory(row.action);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-iron/20 hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => router.push(`/admin/logs/${row.id}`)}
                    >
                      <td className="px-4 py-3 text-xs text-steel whitespace-nowrap">
                        {formatTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-pure-white">
                          {formatUser(row.userFirstName, row.userLastName, row.userEmail)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex rounded px-2 py-0.5 text-xs font-medium',
                          CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other,
                        )}>
                          {getActionLabel(row.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-steel font-mono">
                        {row.entityType}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-ash truncate max-w-xs block">
                          {row.entityLabel || row.entityId}
                        </span>
                        <ChangesSummary changes={row.changes} />
                      </td>
                      <td className="px-4 py-3">
                        <Eye className="size-4 text-steel" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ash">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-ash">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
