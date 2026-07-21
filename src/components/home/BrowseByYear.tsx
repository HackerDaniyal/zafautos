import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { placeholderVehicles } from '@/data/placeholderVehicles';

export function BrowseByYear() {
  return (
    <VehicleListingSection
      title="Browse by Year"
      description="Filter by model year to find the newest or best-value imports."
      vehicles={placeholderVehicles.slice(0, 14)}
    />
  );
}
