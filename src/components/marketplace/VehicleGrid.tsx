'use client';

import React, { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleCard, type VehicleCardData } from './VehicleCard';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

interface VehicleGridProps {
  vehicles: VehicleCardData[];
  className?: string;
}

export function VehicleGrid({ vehicles, className }: VehicleGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{vehicles.length}</span> vehicles found
        </p>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Vehicle Cards */}
      {vehicles.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No vehicles found matching your criteria.</p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col gap-4'
          )}
        >
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} variant={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
