'use client';

import { cn } from '@/lib/utils';
import {
  type LucideIcon,
  Car,
  CreditCard,
  Truck,
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  FileText,
  Settings,
  Shield,
  Warehouse,
  DollarSign,
  Check,
  AlertCircle,
  Ship,
  MapPin,
  StickyNote,
  Hash,
  Clock,
  XCircle,
  UserCheck,
  UserX,
  ShoppingCart,
  ImageIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Car,
  CreditCard,
  Truck,
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  FileText,
  Settings,
  Shield,
  Warehouse,
  DollarSign,
  Check,
  AlertCircle,
  Ship,
  MapPin,
  StickyNote,
  Hash,
  Clock,
  XCircle,
  UserCheck,
  UserX,
  ShoppingCart,
  ImageIcon,
};

type IconName = keyof typeof ICON_MAP;

interface StatCardProps {
  title?: string;
  value: string | number;
  description?: string;
  icon: IconName;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  variant?: 'default' | 'compact';
  label?: string;
  color?: string;
}

function StatCard({ title, value, description, icon, trend, className, variant = 'default', label, color = 'text-pure-white' }: StatCardProps) {
  const Icon = ICON_MAP[icon] ?? Car;

  if (variant === 'compact') {
    return (
      <div className={cn('rounded-[10px] border border-iron/30 bg-carbon p-4', className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-steel">{label ?? title}</p>
            <p className={cn('text-xl font-bold font-[Oswald] uppercase tracking-wide', color)}>
              {value}
            </p>
          </div>
          <div className="rounded-[6px] bg-iron/20 p-2">
            <Icon className="size-4 text-steel" />
          </div>
        </div>
      </div>
    );
  }

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
