'use client';

import { SectionHeader } from '@/components/admin/ui/section-header';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  userId: string | null;
  createdAt: Date;
}

function DashboardActivity({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <SectionHeader title="Recent Activity" />
        <p className="mt-4 text-sm text-ash text-center py-8">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
      <SectionHeader title="Recent Activity" />
      <div className="mt-4 space-y-3">
        {activities.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded-[6px] border border-iron/30 p-3">
            <div className="rounded-[6px] bg-iron/20 p-2 mt-0.5">
              <Activity className="size-4 text-steel" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-pure-white">
                <span className="font-medium">{a.action.replace(/\./g, ' ')}</span>
                {a.entityLabel && (
                  <span className="text-ash"> — {a.entityLabel}</span>
                )}
              </p>
              <p className="text-xs text-steel mt-0.5">
                {a.entityType} · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DashboardActivity };
