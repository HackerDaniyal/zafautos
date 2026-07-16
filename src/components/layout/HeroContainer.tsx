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
    <div className={cn("relative overflow-hidden bg-background py-20 md:py-32", className)} {...props}>
      {backgroundSlot && (
        <div className="absolute inset-0 z-0 opacity-20 md:opacity-50 pointer-events-none">
          {backgroundSlot}
        </div>
      )}
      <MainContainer className="relative z-10">
        <div className="flex max-w-[800px] flex-col items-start gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-[600px] text-lg text-muted-foreground sm:text-xl">
              {subtitle}
            </p>
          )}
          {actions && (
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center mt-4">
              {actions}
            </div>
          )}
        </div>
      </MainContainer>
    </div>
  );
}
