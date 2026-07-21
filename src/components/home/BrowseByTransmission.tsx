import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { placeholderVehicles } from '@/data/placeholderVehicles';

export function BrowseByTransmission() {
  return (
    <VehicleListingSection
      title="Browse by Transmission"
      description="Automatic or manual — choose your driving preference."
      vehicles={placeholderVehicles.slice(0, 14)}
    />
  );
}
