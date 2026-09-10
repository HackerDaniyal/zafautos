'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

function LoadingOverlay({ loading = true, children, className }: LoadingOverlayProps) {
  if (!loading) return <>{children}</>;

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-race-black/60 backdrop-blur-sm">
        <Loader2 className="size-6 animate-spin text-signal-red" />
      </div>
    </div>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <Loader2 className="size-6 animate-spin text-signal-red" />
    </div>
  );
}

export { LoadingOverlay, LoadingSpinner };
