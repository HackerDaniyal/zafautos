import React from 'react';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import Link from 'next/link';

const makes = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Daihatsu',
  'Lexus', 'Isuzu', 'Hino', 'Mitsuoka'
];

export function ShopByMake() {
  return (
    <SectionWrapper>
      <PageHeader title="Shop By Make" />
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {makes.map((make) => (
          <Link
            key={make}
            href={`/vehicles?make=${make.toLowerCase()}`}
            className="group flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <div className="mb-3 h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground group-hover:bg-background">
              Logo
            </div>
            <span className="text-sm font-medium">{make}</span>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
}
