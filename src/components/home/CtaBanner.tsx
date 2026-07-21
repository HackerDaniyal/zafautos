import React from 'react';
import { CTASection } from '@/components/layout/SectionLayouts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CtaBanner() {
  return (
    <CTASection>
      <h2 className="font-[Oswald] text-3xl font-bold uppercase tracking-[0.3px] sm:text-4xl text-pure-white">Ready to import your dream car?</h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-pure-white/80">
        Join thousands of satisfied customers who have successfully imported high-quality Japanese vehicles through ZafAutos.
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
        <Button size="lg" asChild className="bg-pure-white text-race-black hover:bg-pure-white/90 rounded-[6px] font-[Oswald] uppercase tracking-wider">
          <Link href="/register">
            Create an Account
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="bg-transparent text-pure-white border-pure-white hover:bg-pure-white hover:text-race-black rounded-[6px] font-[Oswald] uppercase tracking-wider" asChild>
          <Link href="/contact">
            Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </CTASection>
  );
}
