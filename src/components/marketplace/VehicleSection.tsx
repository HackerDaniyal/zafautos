import React from 'react';
import { CompactVehicleCard } from '@/components/marketplace/CompactVehicleCard';
import { VehicleCardData } from '@/components/marketplace/VehicleCard';
import { cn } from '@/lib/utils';

interface VehicleSectionProps {
  vehicles: VehicleCardData[];
  className?: string;
}

export function VehicleSection({ vehicles, className }: VehicleSectionProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 items-stretch gap-3',
        'sm:grid-cols-2 sm:gap-3.5',
        'md:grid-cols-3 md:gap-3.5',
        'lg:grid-cols-5 lg:gap-3',
        'xl:grid-cols-6 xl:gap-3',
        '2xl:grid-cols-7 2xl:gap-3',
        className
      )}
    >
      {vehicles.map((vehicle) => (
        <CompactVehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
