'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompareBarProps {
  selectedIds?: string[];
  maxSelect?: number;
  onRemove?: (id: string) => void;
  onCompare?: () => void;
  className?: string;
}

export function CompareBar({
  selectedIds = [],
  maxSelect = 4,
  onRemove,
  onCompare,
  className,
}: CompareBarProps) {
  if (selectedIds.length === 0) return null;

  return (
    <div className={cn('fixed inset-x-0 bottom-0 bg-card border-t py-3 shadow-lg md:static md:bottom-auto md:rounded-lg md:my-4', className)}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {selectedIds.map((id) => (
            <div key={id} className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-sm">
              <span>{id}</span>
              {onRemove && (
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => onRemove(id)}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          {selectedIds.length < maxSelect && (
            <span className="text-muted-foreground text-sm">Add up to {maxSelect - selectedIds.length} more</span>
          )}
        </div>
        <Button onClick={onCompare} disabled={selectedIds.length < 2}>
          Compare ({selectedIds.length})
        </Button>
      </div>
    </div>
  );
}
