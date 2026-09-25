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
        'flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory',
        'lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:pb-0 lg:snap-none',
        className
      )}
    >
      {unique.map((vehicle) => (
        <div key={vehicle.id} className="min-w-[260px] max-w-[260px] snap-start lg:min-w-0 lg:max-w-none lg:snap-none">
          <CompactVehicleCard vehicle={vehicle} />
        </div>
      ))}
    </div>
  );
}
