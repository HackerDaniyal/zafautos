'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfigDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function ConfigDrawer({ open, title, onClose, children }: ConfigDrawerProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-deep-carbon border-l border-iron/30 shadow-2xl transition-transform duration-300 flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-iron/20">
          <h3 className="text-sm font-semibold text-pure-white">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
