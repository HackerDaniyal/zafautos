'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Check, CheckCheck, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/admin/ui/section-header';
import { cn } from '@/lib/utils';
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '@/server/actions/adminNotificationActions';

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  body: string;
  status: 'unread' | 'read' | 'archived';
  link: string | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  order: 'Order',
  payment: 'Payment',
  shipping: 'Shipping',
  support: 'Support',
  lead: 'Lead',
  vehicle: 'Vehicle',
  system: 'System',
};

const CATEGORY_COLORS: Record<string, string> = {
  order: 'bg-blue-500/10 text-blue-400',
  payment: 'bg-available-green/10 text-available-green',
  shipping: 'bg-cyan-500/10 text-cyan-400',
  support: 'bg-purple-500/10 text-purple-400',
  lead: 'bg-auction-amber/10 text-auction-amber',
  vehicle: 'bg-signal-red/10 text-signal-red',
  system: 'bg-steel/10 text-steel',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AdminNotificationsClient() {
  const [data, setData] = useState<{ notifications: Notification[]; total: number; page: number; pageSize: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await getAdminNotifications({
        page: p,
        pageSize: 20,
        status: filter === 'all' ? undefined : filter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      });
      if (result.success && result.data) {
        setData(result.data as typeof data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filter, categoryFilter]);

  useEffect(() => { fetchData(page); }, [fetchData, page]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  async function handleMarkRead(id: string) {
    await markAdminNotificationRead(id);
    if (data) {
      setData({
        ...data,
        notifications: data.notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n,
        ),
      });
    }
  }

  async function handleMarkAllRead() {
    await markAllAdminNotificationsRead();
    if (data) {
      setData({
        ...data,
        notifications: data.notifications.map((n) => ({ ...n, status: 'read' as const })),
      });
    }
    setFeedback('All notifications marked as read');
  }

  const unreadCount = data?.notifications.filter((n) => n.status === 'unread').length ?? 0;

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-[6px] px-4 py-2 text-sm bg-available-green/10 text-available-green">
          {feedback}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-signal-red" />
          <span className="text-sm text-ash">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </span>
        </div>
        <div className="ml-auto">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
              <CheckCheck className="size-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-[6px] border border-iron/30 bg-carbon p-1">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={cn(
                'rounded-[4px] px-3 py-1 text-xs font-medium transition-colors capitalize',
                filter === f ? 'bg-signal-red text-pure-white' : 'text-ash hover:text-pure-white',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="h-7 rounded-[6px] border border-iron bg-deep-carbon px-2 text-xs text-pure-white outline-none"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-steel" />
        </div>
      )}

      {/* Empty */}
      {!loading && data && data.notifications.length === 0 && (
        <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-12 text-center">
          <Check className="mx-auto h-12 w-12 text-available-green" />
          <p className="mt-4 text-sm text-steel">You&apos;re all caught up.</p>
        </div>
      )}

      {/* Notifications */}
      {!loading && data && data.notifications.length > 0 && (
        <div className="space-y-2">
          {data.notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'rounded-[10px] border p-4 transition-colors',
                n.status === 'unread'
                  ? 'border-signal-red/20 bg-signal-red/5'
                  : 'border-iron/10 bg-deep-carbon',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium', CATEGORY_COLORS[n.category] ?? 'bg-steel/10 text-steel')}>
                      {CATEGORY_LABELS[n.category] ?? n.category}
                    </span>
                    {n.status === 'unread' && (
                      <span className="size-1.5 rounded-full bg-signal-red" />
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-pure-white">{n.title}</p>
                  <p className="mt-1 text-xs text-ash">{n.body}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-[10px] text-steel">{timeAgo(n.createdAt)}</p>
                    {n.link && (
                      <a href={n.link} className="text-[10px] text-signal-red hover:underline">
                        View details
                      </a>
                    )}
                  </div>
                </div>
                {n.status === 'unread' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkRead(n.id)}
                    className="shrink-0 h-7 px-2"
                  >
                    <Check className="size-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-steel">
            Page {data.page} of {data.totalPages} ({data.total} notifications)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="h-7 px-2"
            >
              <ChevronLeft className="size-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(data.totalPages, page + 1))}
              disabled={page >= data.totalPages}
              className="h-7 px-2"
            >
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
