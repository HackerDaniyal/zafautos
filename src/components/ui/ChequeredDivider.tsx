import React from 'react';
import { cn } from '@/lib/utils';

interface ChequeredDividerProps {
  className?: string;
}

export function ChequeredDivider({ className }: ChequeredDividerProps) {
  return (
    <div className={cn("chequered-divider w-full", className)} aria-hidden="true" />
  );
}
