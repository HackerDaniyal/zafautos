'use client';

import { useState } from 'react';
import {
  PlusCircle,
  Pencil,
  Trash2,
  ArrowRightLeft,
  MessageSquare,
  Upload,
  CheckCircle,
  XCircle,
  ChevronDown,
  Copy,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

type ActivityType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'comment'
  | 'uploaded'
  | 'approved'
  | 'rejected';

interface TimelineActivity {
  id: string;
  type: ActivityType;
  actor: { name: string; email: string; avatar?: string };
  target: { type: string; name: string; id: string };
  details?: Record<string, unknown>;
  timestamp: Date | string;
}

interface TimelineEntryProps {
  activity: TimelineActivity;
  expanded?: boolean;
}

const typeConfig: Record<
  ActivityType,
  { icon: typeof PlusCircle; color: string; bg: string; verb: string }
> = {
  created: {
    icon: PlusCircle,
    color: 'text-available-green',
    bg: 'bg-available-green/10',
    verb: 'created',
  },
  updated: {
    icon: Pencil,
    color: 'text-link-blue',
    bg: 'bg-link-blue/10',
    verb: 'updated',
  },
  deleted: {
    icon: Trash2,
    color: 'text-signal-red',
    bg: 'bg-signal-red/10',
    verb: 'deleted',
  },
  status_changed: {
    icon: ArrowRightLeft,
    color: 'text-auction-amber',
    bg: 'bg-auction-amber/10',
    verb: 'changed status of',
  },
  comment: {
    icon: MessageSquare,
    color: 'text-ash',
    bg: 'bg-ash/10',
    verb: 'commented on',
  },
  uploaded: {
    icon: Upload,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    verb: 'uploaded to',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-available-green',
    bg: 'text-available-green/10',
    verb: 'approved',
  },
  rejected: {
    icon: XCircle,
    color: 'text-signal-red',
    bg: 'bg-signal-red/10',
    verb: 'rejected',
  },
};

function formatChanges(
  details: Record<string, unknown>
): { field: string; from: string; to: string }[] {
  return Object.entries(details).map(([key, value]) => {
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase());
    if (
      value &&
      typeof value === 'object' &&
      'old' in value &&
      'new' in value
    ) {
      const change = value as { old: unknown; new: unknown };
      return {
        field: label,
        from: change.old === null || change.old === undefined ? '—' : String(change.old),
        to: change.new === null || change.new === undefined ? '—' : String(change.new),
      };
    }
    return { field: label, from: '—', to: String(value) };
  });
}

function TimelineEntry({ activity, expanded: controlledExpanded }: TimelineEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? expanded;
  const config = typeConfig[activity.type];
  const Icon = config.icon;
  const timestamp = new Date(activity.timestamp);
  const hasDetails = activity.details && Object.keys(activity.details).length > 0;
  const changes = hasDetails ? formatChanges(activity.details!) : [];

  return (
    <div className="group relative flex gap-4">
      {/* Timeline line */}
      <div className="relative flex flex-col items-center">
        {/* Dot */}
        <div
          className={cn(
            'z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-carbon',
            config.bg
          )}
        >
          <Icon className={cn('size-4', config.color)} />
        </div>
        {/* Vertical line */}
        <div className="w-px flex-1 bg-iron/50" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-pure-white">
              <span className="font-medium text-pure-white">{activity.actor.name}</span>{' '}
              <span className="text-ash">{config.verb}</span>{' '}
              <span className="font-medium text-pure-white">{activity.target.name}</span>
            </p>
            {activity.target.type && (
              <p className="mt-0.5 text-xs text-steel capitalize">
                {activity.target.type}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {hasDetails && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="rounded-[4px] p-1 text-steel transition-colors hover:bg-iron/30 hover:text-pure-white"
                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>
            )}
            <div
              className="group/timestamp cursor-default"
              title={format(timestamp, 'PPpp')}
            >
              <span className="text-xs text-steel transition-colors group-hover/timestamp:text-ash">
                {formatDistanceToNow(timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && hasDetails && (
          <div className="mt-3 rounded-[6px] border border-iron/30 bg-deep-carbon p-3">
            {changes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-ash uppercase tracking-wider">
                  Changes
                </p>
                <div className="space-y-1.5">
                  {changes.map((change) => (
                    <div
                      key={change.field}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="shrink-0 font-medium text-ash min-w-[100px]">
                        {change.field}
                      </span>
                      <span className="text-signal-red/80 line-through">
                        {change.from}
                      </span>
                      <span className="text-steel">→</span>
                      <span className="text-available-green">{change.to}</span>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${change.field}: ${change.from} → ${change.to}`
                          )
                        }
                        className="ml-auto shrink-0 rounded p-0.5 text-steel opacity-0 transition-opacity hover:text-pure-white group-hover:opacity-100"
                        aria-label="Copy change"
                      >
                        <Copy className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(activity.details!).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 font-medium text-ash min-w-[100px] capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-pure-white break-all">
                      {typeof value === 'object' && value !== null
                        ? JSON.stringify(value, null, 2)
                        : String(value ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { TimelineEntry };
export type { TimelineEntryProps, ActivityType, TimelineActivity };
