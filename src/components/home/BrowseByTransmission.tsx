import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import type { VehicleCardData } from '@/components/marketplace/VehicleCard';

interface BrowseByTransmissionProps {
  vehicles: VehicleCardData[];
}

export function BrowseByTransmission({ vehicles }: BrowseByTransmissionProps) {
  return (
    <VehicleListingSection
      title="Browse by Transmission"
      description="Automatic, manual, or CVT — choose your preference."
      vehicles={vehicles}
    />
  );
}
