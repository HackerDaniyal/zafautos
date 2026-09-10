'use client';

import { useCallback } from 'react';
import { useToastStore, type ToastVariant } from '@/stores/toast-store';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

function useToast() {
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);

  const toast = useCallback(
    (options: ToastOptions) => {
      addToast({
        title: options.title,
        description: options.description,
        variant: options.variant ?? 'default',
        duration: options.duration,
        action: options.action,
      });
    },
    [addToast]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  return { toast, dismiss };
}

export { useToast };
export type { ToastOptions };
