import React from 'react';
import { CTASection } from '@/components/layout/SectionLayouts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CtaBannerProps {
  title?: string | null;
  subtitle?: string | null;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  button2Label?: string | null;
  button2Url?: string | null;
}

export function CtaBanner({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  button2Label,
  button2Url,
}: CtaBannerProps) {
  return (
    <CTASection>
      <h2 className="font-[Oswald] text-3xl font-bold uppercase tracking-[0.3px] sm:text-4xl text-pure-white">
        {title || 'Ready to import your dream car?'}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-pure-white/80">
        {subtitle || 'Join thousands of satisfied customers who have successfully imported high-quality Japanese vehicles through ZafAutos.'}
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
        <Button size="lg" asChild className="bg-pure-white text-race-black hover:bg-pure-white/90 rounded-[6px] font-[Oswald] uppercase tracking-wider">
          <Link href={buttonUrl || '/register'}>
            {buttonLabel || 'Create an Account'}
          </Link>
        </Button>
        {(button2Label || button2Url) && (
          <Button size="lg" variant="outline" className="bg-transparent text-pure-white border-pure-white hover:bg-pure-white hover:text-race-black rounded-[6px] font-[Oswald] uppercase tracking-wider" asChild>
            <Link href={button2Url || '/contact'}>
              {button2Label || 'Contact Sales'} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
        {!button2Label && !button2Url && (
          <Button size="lg" variant="outline" className="bg-transparent text-pure-white border-pure-white hover:bg-pure-white hover:text-race-black rounded-[6px] font-[Oswald] uppercase tracking-wider" asChild>
            <Link href="/contact">
              Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </CTASection>
  );
}
