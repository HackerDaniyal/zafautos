'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[600px]',
  lg: 'sm:max-w-[800px]',
};

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  footer,
  loading = false,
  size = 'md',
  className,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          'bg-carbon border-iron/30',
          sizeClasses[size],
          className
        )}
      >
        <SheetHeader className="gap-1">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <SheetTitle>{title}</SheetTitle>
              {description && <SheetDescription>{description}</SheetDescription>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
            </div>
          </div>
        </SheetHeader>

        <Separator className="bg-iron/30" />

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-2 scrollbar-thin">
          {loading ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-carbon/80 backdrop-blur-sm">
              <Loader2 className="size-6 animate-spin text-signal-red" />
            </div>
          ) : null}
          {children}
        </div>

        {footer && (
          <>
            <Separator className="bg-iron/30" />
            <SheetFooter>{footer}</SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { DetailDrawer };
export type { DetailDrawerProps };
