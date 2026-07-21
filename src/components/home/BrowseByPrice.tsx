import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { placeholderVehicles } from '@/data/placeholderVehicles';

export function BrowseByPrice() {
  return (
    <VehicleListingSection
      title="Browse by Price"
      description="Find vehicles within your budget range."
      vehicles={placeholderVehicles.slice(0, 14)}
    />
  );
}
