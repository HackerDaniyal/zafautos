import { cn } from '@/lib/utils';

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';

const STATUS_STYLES: Record<StatusVariant, string> = {
  default: 'bg-signal-red/10 text-signal-red border-signal-red/20',
  success: 'bg-available-green/10 text-available-green border-available-green/20',
  warning: 'bg-auction-amber/10 text-auction-amber border-auction-amber/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  muted: 'bg-iron/50 text-steel border-iron',
};

interface StatusChipProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

function StatusChip({ label, variant = 'default', className }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[variant],
        className
      )}
    >
      <span className="mr-1.5 size-1.5 rounded-full bg-current opacity-60" />
      {label}
    </span>
  );
}

function getStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'active':
    case 'delivered':
    case 'paid':
    case 'available':
      return 'success';
    case 'pending':
    case 'processing':
    case 'in_transit':
      return 'warning';
    case 'cancelled':
    case 'failed':
    case 'blocked':
    case 'suspended':
      return 'error';
    case 'draft':
    case 'archived':
      return 'muted';
    case 'sold':
      return 'muted';
    case 'shipped':
    case 'confirmed':
      return 'info';
    default:
      return 'default';
  }
}

export { StatusChip, getStatusVariant };
