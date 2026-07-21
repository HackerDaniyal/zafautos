import React from 'react';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import { Star } from 'lucide-react';
import { placeholderTestimonials } from '@/data/placeholderTestimonials';

export function CustomerTestimonials() {
  return (
    <SectionWrapper>
      <PageHeader title="What Our Customers Say" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {placeholderTestimonials.map((testimonial, i) => (
          <div key={i} className="rounded-[10px] border border-iron bg-carbon p-6">
            <div className="flex text-auction-amber mb-4">
              {[...Array(5)].map((_, index) => (
                <Star 
                  key={index} 
                  className={`h-4 w-4 ${index < testimonial.rating ? 'fill-current' : 'text-iron'}`} 
                />
              ))}
            </div>
            <p className="mb-6 italic text-ash">&quot;{testimonial.content}&quot;</p>
            <div>
              <p className="font-[Oswald] font-bold uppercase tracking-wider text-pure-white">{testimonial.name}</p>
              <p className="text-sm text-steel">{testimonial.country}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
