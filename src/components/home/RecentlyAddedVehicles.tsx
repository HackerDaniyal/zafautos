import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { placeholderVehicles } from '@/data/placeholderVehicles';

export function RecentlyAddedVehicles() {
  return (
    <VehicleListingSection
      title="Recently Added"
      description="Fresh stock just arrived from Japanese auctions."
      vehicles={placeholderVehicles.slice(0, 14)}
    />
  );
}
