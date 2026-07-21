import React from 'react';
import { cn } from '@/lib/utils';
import { MainContainer } from './MainContainer';

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  containerClassName?: string;
}

export function FeatureSection({ children, className, containerClassName, ...props }: SectionProps) {
  return (
    <section className={cn("py-16 md:py-24 bg-carbon", className)} {...props}>
      <MainContainer className={containerClassName}>
        {children}
      </MainContainer>
    </section>
  );
}

export function ContentSection({ children, className, containerClassName, ...props }: SectionProps) {
  return (
    <section className={cn("py-12 md:py-20 bg-race-black", className)} {...props}>
      <MainContainer className={containerClassName}>
        {children}
      </MainContainer>
    </section>
  );
}

export function CTASection({ children, className, containerClassName, ...props }: SectionProps) {
  return (
    <section className={cn("py-16 md:py-24 bg-signal-red text-pure-white", className)} {...props}>
      <MainContainer className={cn("flex flex-col items-center text-center", containerClassName)}>
        {children}
      </MainContainer>
    </section>
  );
}

export function StatsSection({ children, className, containerClassName, ...props }: SectionProps) {
  return (
    <section className={cn("py-12 border-y border-iron bg-carbon", className)} {...props}>
      <MainContainer className={containerClassName}>
        {children}
      </MainContainer>
    </section>
  );
}

export function FAQSection({ children, className, containerClassName, ...props }: SectionProps) {
  return (
    <section className={cn("py-16 md:py-24 bg-race-black", className)} {...props}>
      <MainContainer className={cn("max-w-4xl", containerClassName)}>
        {children}
      </MainContainer>
    </section>
  );
}
