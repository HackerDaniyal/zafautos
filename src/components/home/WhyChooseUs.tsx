import React from 'react';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import { ShieldCheck, Globe2, Wrench, BadgeJapaneseYen } from 'lucide-react';

const features = [
  {
    title: 'Trusted Inspections',
    description: 'Every vehicle undergoes a rigorous multi-point inspection before export.',
    icon: ShieldCheck,
  },
  {
    title: 'Global Shipping',
    description: 'We handle logistics to deliver your vehicle safely to major ports worldwide.',
    icon: Globe2,
  },
  {
    title: 'Expert Maintenance',
    description: 'Our team ensures vehicles are serviced and meet high quality standards.',
    icon: Wrench,
  },
  {
    title: 'Competitive Pricing',
    description: 'Direct from Japan auctions, ensuring you get the best value for your money.',
    icon: BadgeJapaneseYen,
  },
];

export function WhyChooseUs() {
  return (
    <SectionWrapper>
      <PageHeader 
        title="Why Choose ZafAutos?" 
        description="We are committed to providing a seamless, transparent, and high-quality vehicle import experience." 
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, i) => (
          <div key={i} className="rounded-[10px] border border-iron bg-carbon p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-signal-red/10 text-signal-red mx-auto">
              <feature.icon className="h-8 w-8" />
            </div>
            <h3 className="font-[Oswald] text-lg font-bold uppercase tracking-[0.3px] text-pure-white mb-2">{feature.title}</h3>
            <p className="text-sm text-ash">{feature.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
