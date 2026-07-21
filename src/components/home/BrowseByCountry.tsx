import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { placeholderVehicles } from '@/data/placeholderVehicles';

export function BrowseByCountry() {
  return (
    <VehicleListingSection
      title="Browse by Country"
      description="Select your destination country for shipping estimates."
      vehicles={placeholderVehicles.slice(0, 14)}
    />
  );
}
