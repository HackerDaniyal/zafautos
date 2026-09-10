import React from 'react';
import { CompactVehicleCard } from '@/components/marketplace/CompactVehicleCard';
import { VehicleCardData } from '@/components/marketplace/VehicleCard';
import { cn } from '@/lib/utils';

interface VehicleSectionProps {
  vehicles: VehicleCardData[];
  className?: string;
}

export function VehicleSection({ vehicles, className }: VehicleSectionProps) {
  const unique = React.useMemo(() => {
    const seen = new Set<string>();
    return vehicles.filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }, [vehicles]);

  return (
    <div
      className={cn(
        'grid grid-cols-1 items-stretch gap-3',
        'sm:grid-cols-2 sm:gap-3.5',
        'md:grid-cols-3 md:gap-3.5',
        'lg:grid-cols-5 lg:gap-4',
        className
      )}
    >
      {unique.map((vehicle) => (
        <CompactVehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
