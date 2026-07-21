import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { placeholderVehicles } from '@/data/placeholderVehicles';

export function BrowseByFuelType() {
  return (
    <VehicleListingSection
      title="Browse by Fuel Type"
      description="Petrol, diesel, hybrid — pick what suits you."
      vehicles={placeholderVehicles.slice(0, 14)}
    />
  );
}
