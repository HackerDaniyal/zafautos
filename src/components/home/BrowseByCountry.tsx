import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import type { VehicleCardData } from '@/components/marketplace/VehicleCard';

interface BrowseByCountryProps {
  vehicles: VehicleCardData[];
}

export function BrowseByCountry({ vehicles }: BrowseByCountryProps) {
  return (
    <VehicleListingSection
      title="Browse by Country"
      description="Select your destination country for shipping estimates."
      vehicles={vehicles}
    />
  );
}
