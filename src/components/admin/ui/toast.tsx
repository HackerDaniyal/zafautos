'use client';

import { useEffect, useCallback } from 'react';
import { useToastStore, type Toast as ToastType } from '@/stores/toast-store';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const variantStyles: Record<ToastType['variant'], string> = {
  default: 'border-iron/30 bg-carbon text-pure-white',
  success: 'border-available-green/30 bg-carbon text-pure-white',
  error: 'border-signal-red/30 bg-carbon text-pure-white',
  warning: 'border-auction-amber/30 bg-carbon text-pure-white',
  info: 'border-link-blue/30 bg-carbon text-pure-white',
};

const indicatorStyles: Record<ToastType['variant'], string> = {
  default: 'bg-steel',
  success: 'bg-available-green',
  error: 'bg-signal-red',
  warning: 'bg-auction-amber',
  info: 'bg-link-blue',
};

interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm animate-[slideIn_0.3s_ease-out] overflow-hidden rounded-lg border shadow-lg',
        variantStyles[toast.variant]
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={cn('mt-0.5 h-2 w-2 shrink-0 rounded-full', indicatorStyles[toast.variant])} />
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium text-pure-white">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm text-ash">{toast.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-signal-red transition-colors hover:bg-signal-red/10"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => onDismiss(toast.id)}
            className="rounded-md p-1 text-steel transition-colors hover:bg-iron/30 hover:text-pure-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  const handleDismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}

export { ToastContainer, ToastItem };
