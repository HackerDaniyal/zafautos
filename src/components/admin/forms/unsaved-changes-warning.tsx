'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UseUnsavedChangesWarningProps {
  isDirty: boolean;
  message?: string;
}

function useUnsavedChangesWarning({
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesWarningProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pendingNavigation = useRef<string | null>(null);
  const confirmedNavigation = useRef(false);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  const interceptNavigation = useCallback(
    (href: string) => {
      if (!isDirty || confirmedNavigation.current) {
        router.push(href);
        return;
      }

      pendingNavigation.current = href;
      const confirmed = window.confirm(message);

      if (confirmed) {
        confirmedNavigation.current = true;
        router.push(href);
      } else {
        pendingNavigation.current = null;
      }
    },
    [isDirty, message, router],
  );

  const confirmNavigation = useCallback(() => {
    confirmedNavigation.current = true;
    if (pendingNavigation.current) {
      router.push(pendingNavigation.current);
      pendingNavigation.current = null;
    }
  }, [router]);

  const cancelNavigation = useCallback(() => {
    pendingNavigation.current = null;
  }, []);

  const resetState = useCallback(() => {
    confirmedNavigation.current = false;
    pendingNavigation.current = null;
  }, []);

  useEffect(() => {
    confirmedNavigation.current = false;
    pendingNavigation.current = null;
  }, [pathname]);

  return {
    interceptNavigation,
    confirmNavigation,
    cancelNavigation,
    resetState,
    hasPendingNavigation: pendingNavigation.current !== null,
  };
}

export { useUnsavedChangesWarning, type UseUnsavedChangesWarningProps };
