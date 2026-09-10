import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import type { VehicleCardData } from '@/components/marketplace/VehicleCard';

interface BrowseByYearProps {
  vehicles: VehicleCardData[];
}

export function BrowseByYear({ vehicles }: BrowseByYearProps) {
  return (
    <VehicleListingSection
      title="Browse by Year"
      description="Filter by model year to find the newest or best-value imports."
      vehicles={vehicles}
    />
  );
}
