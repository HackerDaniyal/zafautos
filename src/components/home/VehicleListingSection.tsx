import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { VehicleSection } from '@/components/marketplace/VehicleSection';
import { VehicleCardData } from '@/components/marketplace/VehicleCard';

interface VehicleListingSectionProps {
  title: string;
  description?: string;
  vehicles: VehicleCardData[];
  viewAllLink?: string;
  viewAllLabel?: string;
}

export function VehicleListingSection({
  title,
  description,
  vehicles,
  viewAllLink = '/vehicles',
  viewAllLabel = 'View All',
}: VehicleListingSectionProps) {
  const displayVehicles = vehicles.slice(0, 5);
  return (
    <section>
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          asChild
          className="group/viewall h-auto px-0 py-0 text-xs font-semibold text-gray-500 hover:bg-transparent hover:text-[#E5231B]"
        >
          <Link href={viewAllLink} className="flex items-center gap-1.5">
            {viewAllLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover/viewall:translate-x-0.5" />
          </Link>
        </Button>
      </div>
      <VehicleSection vehicles={displayVehicles} />
    </section>
  );
}
