'use client';

import React, { useState } from 'react';
import { LayoutGrid, List, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleCard, type VehicleCardData } from './VehicleCard';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

interface VehicleGridProps {
  vehicles: VehicleCardData[];
  className?: string;
  onClearFilters?: () => void;
}

export function VehicleGrid({ vehicles, className, onClearFilters }: VehicleGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  if (vehicles.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/30 text-center p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <SearchX className="h-8 w-8 text-gray-300" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="font-[Oswald] text-lg font-bold uppercase tracking-wider text-gray-900">No vehicles found</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            No vehicles match your current filters. Try adjusting your search criteria or clearing all filters.
          </p>
        </div>
        {onClearFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="border-gray-200 text-gray-900 hover:bg-gray-100 hover:border-gray-400 rounded-[6px] px-5 py-2 text-xs font-medium uppercase tracking-wider mt-2"
          >
            Clear all filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* View toggle + count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-900">{vehicles.length}</span> vehicle{vehicles.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Vehicle Cards */}
      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
            : 'flex flex-col gap-4'
        )}
      >
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} variant={viewMode} />
        ))}
      </div>
    </div>
  );
}
