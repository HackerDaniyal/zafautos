import { cn } from '@/lib/utils';
import { FileX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  title = 'No data',
  description = 'No records found.',
  icon: Icon = FileX,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-iron/30 p-4 mb-4">
        <Icon className="size-8 text-steel" />
      </div>
      <h3 className="text-lg font-semibold text-pure-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ash">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export { EmptyState };
