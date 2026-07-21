import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { placeholderVehicles } from '@/data/placeholderVehicles';

export function AuctionVehicles() {
  return (
    <VehicleListingSection
      title="Auction Vehicles"
      description="Live auction vehicles with competitive pricing."
      vehicles={placeholderVehicles.slice(0, 14)}
    />
  );
}
