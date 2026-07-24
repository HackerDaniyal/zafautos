import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold text-pure-white">{title}</h2>
        {description && (
          <p className="text-sm text-ash">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export { SectionHeader };
