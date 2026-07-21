import React from 'react';
import { StatsSection } from '@/components/layout/SectionLayouts';

const stats = [
  { value: '15,000+', label: 'Vehicles Exported' },
  { value: '120+', label: 'Countries Served' },
  { value: '100%', label: 'Trusted Inspections' },
  { value: '24/7', label: 'Customer Support' },
];

export function FooterCtaStrip() {
  return (
    <StatsSection>
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4 divide-x divide-iron">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center justify-center text-center px-4 first:pl-0 last:pr-0">
            <span className="text-3xl font-bold font-[Oswald] text-pure-white">{stat.value}</span>
            <span className="mt-2 text-sm text-ash uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-50 grayscale">
        <div className="text-xl font-bold text-steel">JUMVEA</div>
        <div className="text-xl font-bold text-steel">JAAI</div>
        <div className="text-xl font-bold text-steel">Secure Payment</div>
      </div>
    </StatsSection>
  );
}
