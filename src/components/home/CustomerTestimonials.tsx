import React from 'react';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  country: string;
  content: string;
  rating: number;
}

interface CustomerTestimonialsProps {
  title?: string | null;
  testimonials?: unknown;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { name: 'Michael R.', country: 'Australia', content: 'The condition of the car was exactly as described. The inspection report was very accurate. Highly recommended!', rating: 5 },
  { name: 'Sarah K.', country: 'United Kingdom', content: 'Smooth import process from start to finish. ZafAutos handled all the shipping paperwork efficiently.', rating: 5 },
  { name: 'David O.', country: 'Kenya', content: 'Great pricing and excellent customer service. They kept me updated throughout the entire shipping process.', rating: 4 },
];

function parseTestimonials(data: unknown): Testimonial[] {
  if (!data || !Array.isArray(data)) return DEFAULT_TESTIMONIALS;
  return data as Testimonial[];
}

export function CustomerTestimonials({ title, testimonials }: CustomerTestimonialsProps) {
  const items = parseTestimonials(testimonials);

  return (
    <SectionWrapper>
      <PageHeader title={title || 'What Our Customers Say'} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((testimonial, i) => (
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
