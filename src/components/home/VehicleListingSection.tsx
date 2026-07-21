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
  return (
    <section>
      <div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:justify-between pb-3">
        <div>
          <h2 className="font-[Oswald] text-[15px] font-bold uppercase tracking-[0.06em] text-[#FFFFFF] md:text-[17px]">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#6E6E6E]">
              {description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          asChild
          className="group/viewall h-auto px-0 py-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5A5A5A] hover:bg-transparent hover:text-[#FFFFFF]"
        >
          <Link href={viewAllLink} className="flex items-center gap-1.5">
            {viewAllLabel}
            <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover/viewall:translate-x-0.5" />
          </Link>
        </Button>
      </div>
      <VehicleSection vehicles={vehicles} />
    </section>
  );
}
