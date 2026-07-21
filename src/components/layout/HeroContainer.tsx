import React from 'react';
import { cn } from '@/lib/utils';
import { MainContainer } from './MainContainer';

interface HeroContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  backgroundSlot?: React.ReactNode;
}

export function HeroContainer({
  title,
  subtitle,
  actions,
  backgroundSlot,
  className,
  ...props
}: HeroContainerProps) {
  return (
    <div className={cn("relative overflow-hidden bg-race-black py-24 md:py-32 lg:py-40", className)} {...props}>
      {backgroundSlot && (
        <div className="absolute inset-0 z-0">
          {backgroundSlot}
        </div>
      )}
      {/* Dark vignette overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-race-black via-race-black/60 to-race-black/30" />
      <MainContainer className="relative z-10">
        <div className="flex max-w-[800px] flex-col items-start gap-6">
          <h1 className="font-[Oswald] text-5xl font-bold uppercase leading-[0.95] tracking-[0.5px] text-pure-white sm:text-6xl md:text-7xl lg:text-[72px]">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-[600px] text-lg leading-relaxed text-smoke sm:text-xl">
              {subtitle}
            </p>
          )}
          {actions && (
            <div className="mt-4 flex w-full flex-col gap-4 sm:flex-row sm:items-center">
              {actions}
            </div>
          )}
        </div>
      </MainContainer>
    </div>
  );
}
