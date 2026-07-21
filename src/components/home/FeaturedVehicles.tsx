import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { placeholderVehicles } from '@/data/placeholderVehicles';

export function FeaturedVehicles() {
  return (
    <VehicleListingSection
      title="Featured Vehicles"
      description="Hand-picked premium Japanese used cars ready for export."
      vehicles={placeholderVehicles.slice(0, 28)}
    />
  );
}
