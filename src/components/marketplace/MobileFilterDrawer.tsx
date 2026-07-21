'use client';

import React, { useState } from 'react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FilterSidebar, type FilterState } from './FilterSidebar';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFilterDrawerProps {
  // placeholder for future props
  className?: string;
}

export function MobileFilterDrawer({ className }: MobileFilterDrawerProps) {
  // The open state is handled internally by the Sheet component.
  const [filters, setFilters] = useState<Partial<FilterState>>({});

  const handleChange = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className={cn('flex items-center gap-2', className)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 12.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17V12.414L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-sm sm:max-w-md" aria-label="Filter drawer">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            <Button variant="ghost" size="icon" onClick={() => {}} aria-label="Close filter drawer">
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex-1 overflow-y-auto">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleChange}
            onReset={handleReset}
          />
        </div>
        <SheetFooter className="mt-4">
          <Button className="w-full" onClick={() => {}}
            >Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
