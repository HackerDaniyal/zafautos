import React from 'react';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import Link from 'next/link';

const bodyTypes = [
  'Sedan', 'SUV', 'Hatchback', 'Minivan', 'Truck', 'Coupe', 'Wagon', 'Van'
];

export function ShopByBodyType() {
  return (
    <SectionWrapper className="bg-muted/30">
      <PageHeader title="Shop By Body Type" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {bodyTypes.map((type) => (
          <Link
            key={type}
            href={`/vehicles?bodyType=${type.toLowerCase()}`}
            className="group relative overflow-hidden rounded-lg bg-card text-card-foreground shadow transition-all hover:shadow-md"
          >
            <div className="aspect-[16/9] bg-muted flex items-center justify-center text-muted-foreground transition-transform group-hover:scale-105">
              Image
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 font-semibold text-white">
              {type}
            </div>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
}
