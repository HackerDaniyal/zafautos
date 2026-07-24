'use client';

import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-[10px] border border-iron/30 bg-carbon p-6',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-ash">{title}</p>
          <p className="text-2xl font-bold text-pure-white">{value}</p>
          {description && (
            <p className="text-xs text-steel">{description}</p>
          )}
          {trend && (
            <p className={cn(
              'text-xs font-medium',
              trend.value >= 0 ? 'text-available-green' : 'text-signal-red'
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className="rounded-[6px] bg-signal-red/10 p-2.5">
          <Icon className="size-5 text-signal-red" />
        </div>
      </div>
    </div>
  );
}

export { StatCard };
