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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {items.map((testimonial, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex text-amber-400 mb-4">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${index < testimonial.rating ? 'fill-current' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <p className="mb-6 text-gray-600 italic leading-relaxed">&quot;{testimonial.content}&quot;</p>
            <div>
              <p className="font-semibold text-gray-900">{testimonial.name}</p>
              <p className="text-sm text-gray-500">{testimonial.country}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
