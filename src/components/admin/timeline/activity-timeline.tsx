'use client';

import { useMemo } from 'react';
import { History } from 'lucide-react';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { TimelineEntry, type TimelineActivity } from './timeline-entry';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { EmptyState } from '@/components/admin/ui/empty-state';

interface ActivityTimelineProps {
  activities: TimelineActivity[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

interface DateGroup {
  label: string;
  activities: TimelineActivity[];
}

function groupByDate(activities: TimelineActivity[]): DateGroup[] {
  const groups: Record<string, TimelineActivity[]> = {};

  for (const activity of activities) {
    const date = new Date(activity.timestamp);
    let key: string;

    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else if (isThisWeek(date)) {
      key = 'Last week';
    } else if (isThisMonth(date)) {
      key = 'This month';
    } else {
      key = 'Older';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key]!.push(activity);
  }

  const order = ['Today', 'Yesterday', 'Last week', 'This month', 'Older'];
  return order
    .filter((key) => groups[key])
    .map((key) => ({ label: key, activities: groups[key]! }));
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, groupIndex) => (
        <div key={groupIndex} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, entryIndex) => (
              <div key={entryIndex} className="flex gap-4">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityTimeline({
  activities,
  loading = false,
  emptyMessage = 'No activity recorded yet.',
  className,
}: ActivityTimelineProps) {
  const groupedActivities = useMemo(() => groupByDate(activities), [activities]);

  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <TimelineSkeleton />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        title="No activity"
        description={emptyMessage}
        icon={History}
        className={className}
      />
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {groupedActivities.map((group) => (
        <div key={group.label} className="mb-6 last:mb-0">
          <div className="sticky top-0 z-20 mb-3 flex items-center gap-3 bg-deep-carbon py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ash">
              {group.label}
            </h3>
            <div className="h-px flex-1 bg-iron/30" />
          </div>
          <div className="space-y-0">
            {group.activities.map((activity) => (
              <TimelineEntry key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { ActivityTimeline };
export type { ActivityTimelineProps };
