import React from 'react';
import { cn } from '@/lib/utils';
import { MainContainer } from './MainContainer';

interface HeroContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  backgroundSlot?: React.ReactNode;
  hasBackground?: boolean;
}

export function HeroContainer({
  title,
  subtitle,
  actions,
  backgroundSlot,
  hasBackground,
  className,
  ...props
}: HeroContainerProps) {
  return (
    <div className={cn("relative overflow-hidden bg-gray-50 py-14 sm:py-20 md:py-32 lg:py-40", className)} {...props}>
      {backgroundSlot && (
        <div className="absolute inset-0 z-0">
          {backgroundSlot}
        </div>
      )}
      {hasBackground && (
        <div className="absolute inset-0 z-[1] bg-black/70" />
      )}
      {!hasBackground && (
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-white via-white/60 to-white/30" />
      )}
      <MainContainer className="relative z-10 flex justify-center">
        <div className="flex max-w-[800px] flex-col items-center text-center gap-6">
          <h1 className={cn(
            "font-[Oswald] text-3xl font-bold uppercase leading-[0.95] tracking-[0.5px] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[72px]",
            hasBackground ? "text-white" : "text-gray-900"
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className={cn(
              "max-w-[600px] text-base leading-relaxed sm:text-lg md:text-xl",
              hasBackground ? "text-white/80" : "text-gray-600"
            )}>
              {subtitle}
            </p>
          )}
          {actions && (
            <div className="mt-4 flex w-full max-w-[500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
              {actions}
            </div>
          )}
        </div>
      </MainContainer>
    </div>
  );
}
