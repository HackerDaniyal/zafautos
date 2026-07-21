import React from 'react';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import { CheckCircle2 } from 'lucide-react';

const steps = [
  {
    title: 'Choose Vehicle',
    description: 'Browse our inventory or request a specific vehicle from Japanese auctions.',
  },
  {
    title: 'Reserve & Invoice',
    description: 'Place a deposit to reserve the vehicle and receive a proforma invoice.',
  },
  {
    title: 'Payment',
    description: 'Complete the payment via secure bank transfer.',
  },
  {
    title: 'Shipping',
    description: 'We arrange shipping and send all necessary export documents via courier.',
  },
  {
    title: 'Delivery',
    description: 'Receive your vehicle at your designated port and clear customs.',
  },
];

export function ImportProcess() {
  return (
    <div id="how-it-works">
    <SectionWrapper className="bg-carbon">
      <PageHeader 
        title="Simple Import Process" 
        description="Getting your dream car from Japan is easier than you think. Just follow these steps."
      />
      <div className="relative mt-8">
        <div className="absolute left-[20px] top-4 bottom-4 w-px bg-iron md:left-1/2 md:-ml-px" />
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col md:flex-row items-start md:items-center">
              <div className="flex-1 text-left md:text-right md:pr-12 pl-12 md:pl-0 mb-2 md:mb-0">
                {index % 2 === 0 ? (
                  <div className="hidden md:block">
                    <h3 className="font-[Oswald] text-xl font-bold uppercase tracking-[0.3px] text-pure-white">{step.title}</h3>
                    <p className="mt-2 text-ash">{step.description}</p>
                  </div>
                ) : null}
              </div>
              
              <div className="absolute left-0 md:left-1/2 md:-ml-5 flex h-10 w-10 items-center justify-center rounded-full border-4 border-race-black bg-signal-red text-pure-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              
              <div className="flex-1 pl-12 md:pl-12">
                {index % 2 !== 0 || true ? (
                  <div className={index % 2 === 0 ? "md:hidden" : ""}>
                    <h3 className="font-[Oswald] text-xl font-bold uppercase tracking-[0.3px] text-pure-white">{step.title}</h3>
                    <p className="mt-2 text-ash">{step.description}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
    </div>
  );
}
