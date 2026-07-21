import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { VehicleCard, type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SimilarVehiclesProps {
  vehicles: VehicleCardData[];
  title?: string;
  viewAllHref?: string;
  className?: string;
}

export function SimilarVehicles({
  vehicles,
  title = 'Similar Vehicles',
  viewAllHref = '/vehicles',
  className,
}: SimilarVehiclesProps) {
  if (vehicles.length === 0) return null;

  return (
    <section className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-[Oswald] text-base font-bold uppercase tracking-wider text-pure-white">{title}</h2>
        <Button variant="ghost" size="sm" asChild className="text-xs text-steel hover:text-pure-white hover:bg-transparent">
          <Link href={viewAllHref} className="flex items-center gap-1">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Horizontal scroll strip */}
      <div className="relative -mx-1">
        <div className="flex gap-4 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scrollbar-hide">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="snap-start shrink-0 w-64 sm:w-72"
            >
              <VehicleCard vehicle={vehicle} variant="grid" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
