'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  children?: React.ReactNode;
  className?: string;
}

function PageHeader({ title, description, action, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-ash">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {action && (
          <Button asChild className="bg-signal-red text-pure-white hover:bg-deep-red rounded-[6px]">
            <Link href={action.href}>
              {action.icon && <action.icon className="mr-2 size-4" />}
              {action.label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export { PageHeader };
