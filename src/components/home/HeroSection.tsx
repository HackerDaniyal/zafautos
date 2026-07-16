import React from 'react';
import { HeroContainer } from '@/components/layout/HeroContainer';
import { Button } from '@/components/ui/button';
import { Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  return (
    <HeroContainer
      title="Premium Japanese Used Vehicles"
      subtitle="Exporting high-quality cars worldwide with full transparency, trusted inspections, and dedicated customer support."
      actions={
        <>
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link href="/vehicles">
              <Search className="mr-2 h-4 w-4" />
              Browse Vehicles
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/about">
              Learn More
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </>
      }
      backgroundSlot={
        <div className="absolute inset-0 bg-gradient-to-r from-background to-muted/20">
          <div className="h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
        </div>
      }
    />
  );
}
