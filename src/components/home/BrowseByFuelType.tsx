import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import type { VehicleCardData } from '@/components/marketplace/VehicleCard';

interface BrowseByFuelTypeProps {
  vehicles: VehicleCardData[];
}

export function BrowseByFuelType({ vehicles }: BrowseByFuelTypeProps) {
  return (
    <VehicleListingSection
      title="Browse by Fuel Type"
      description="Petrol, diesel, hybrid — pick what suits you."
      vehicles={vehicles}
    />
  );
}
