import React from 'react';
import { HeroContainer } from '@/components/layout/HeroContainer';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  return (
    <HeroContainer
      title={<>IMPORTED. INSPECTED.<br />READY.</>}
      subtitle="Premium Japanese used vehicles exported worldwide. Full transparency, trusted inspections, auction-grade quality."
      actions={
        <>
          <Button
            size="lg"
            className="bg-signal-red text-pure-white hover:bg-deep-red rounded-[6px] px-7 py-3.5 text-sm font-medium uppercase tracking-wider"
            asChild
          >
            <Link href="/vehicles">
              <Search className="mr-2 h-4 w-4" />
              View Inventory
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-chrome-silver text-pure-white hover:bg-white/5 hover:border-pure-white rounded-[6px] px-7 py-3.5 text-sm font-medium uppercase tracking-wider"
            asChild
          >
            <Link href="/#how-it-works">
              How It Works
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </>
      }
      backgroundSlot={
        <div className="absolute inset-0 bg-race-black">
          {/* Subtle dot grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, #FFFFFF 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
          {/* Subtle diagonal racing stripes */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 40px, #FFFFFF 40px, #FFFFFF 41px)',
          }} />
        </div>
      }
    />
  );
}
