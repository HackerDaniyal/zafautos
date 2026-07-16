import React from 'react';
import { CTASection } from '@/components/layout/SectionLayouts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CtaBanner() {
  return (
    <CTASection>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to import your dream car?</h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
        Join thousands of satisfied customers who have successfully imported high-quality Japanese vehicles through ZafAutos.
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
        <Button size="lg" variant="secondary" asChild>
          <Link href="/register">
            Create an Account
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
          <Link href="/contact">
            Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </CTASection>
  );
}
