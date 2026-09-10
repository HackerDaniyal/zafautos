import React from 'react';
import { HeroContainer } from '@/components/layout/HeroContainer';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface HeroSectionProps {
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  button2Label?: string | null;
  button2Url?: string | null;
}

export function HeroSection({
  title,
  subtitle,
  imageUrl,
  buttonLabel,
  buttonUrl,
  button2Label,
  button2Url,
}: HeroSectionProps) {
  const heading = title || 'IMPORTED. INSPECTED.\nREADY.';
  const sub = subtitle || 'Premium Japanese used vehicles exported worldwide. Full transparency, trusted inspections, auction-grade quality.';

  return (
    <HeroContainer
      title={heading.includes('\n') ? (
        <>
          {heading.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </>
      ) : heading}
      subtitle={sub}
      actions={
        <>
          <Button
            size="lg"
            className="bg-signal-red text-pure-white hover:bg-deep-red rounded-[6px] px-7 py-3.5 text-sm font-medium uppercase tracking-wider"
            asChild
          >
            <Link href={buttonUrl || '/vehicles'}>
              <Search className="mr-2 h-4 w-4" />
              {buttonLabel || 'View Inventory'}
            </Link>
          </Button>
          {(button2Label || button2Url) && (
            <Button
              size="lg"
              variant="outline"
              className="border-chrome-silver text-pure-white hover:bg-white/5 hover:border-pure-white rounded-[6px] px-7 py-3.5 text-sm font-medium uppercase tracking-wider"
              asChild
            >
              <Link href={button2Url || '/#how-it-works'}>
                {button2Label || 'How It Works'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          {!button2Label && !button2Url && (
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
          )}
        </>
      }
      backgroundSlot={
        imageUrl ? (
          <div className="absolute inset-0 bg-race-black">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-race-black">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle, #FFFFFF 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 40px, #FFFFFF 40px, #FFFFFF 41px)',
            }} />
          </div>
        )
      }
    />
  );
}
