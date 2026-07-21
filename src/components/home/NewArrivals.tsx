import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { placeholderVehicles } from '@/data/placeholderVehicles';

export function NewArrivals() {
  return (
    <VehicleListingSection
      title="New Arrivals"
      description="Latest imports available for immediate purchase."
      vehicles={placeholderVehicles.slice(0, 14)}
    />
  );
}
