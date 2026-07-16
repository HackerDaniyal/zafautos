import React from 'react';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import { ShieldCheck, Globe2, Wrench, BadgeJapaneseYen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
          <Card key={i} className="border-none shadow-none bg-muted/30 text-center">
            <CardHeader className="flex flex-col items-center pb-2">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <feature.icon className="h-8 w-8" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
