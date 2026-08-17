import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import type { VehicleCardData } from '@/components/marketplace/VehicleCard';

interface BrowseByPriceProps {
  vehicles: VehicleCardData[];
}

export function BrowseByPrice({ vehicles }: BrowseByPriceProps) {
  return (
    <VehicleListingSection
      title="Browse by Price"
      description="Find vehicles within your budget range."
      vehicles={vehicles}
    />
  );
}
