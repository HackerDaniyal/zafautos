import React from 'react';
import { WidgetVehicleCard } from '@/components/marketplace/WidgetVehicleCard';
import { VehicleCardData } from '@/components/marketplace/VehicleCard';
import { cn } from '@/lib/utils';

interface WidgetVehicleSectionProps {
  vehicles: VehicleCardData[];
  className?: string;
}

export function WidgetVehicleSection({ vehicles, className }: WidgetVehicleSectionProps) {
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
        'grid items-stretch gap-4',
        'grid-cols-2',
        'md:grid-cols-3 md:gap-4',
        'lg:grid-cols-4 lg:gap-5',
        'xl:grid-cols-6 xl:gap-4',
        className
      )}
    >
      {unique.map((vehicle) => (
        <WidgetVehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
