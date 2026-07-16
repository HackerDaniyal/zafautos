import React from 'react';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Michael R.',
    country: 'Australia',
    content: 'The condition of the car was exactly as described. The inspection report was very accurate. Highly recommended!',
    rating: 5,
  },
  {
    name: 'Sarah K.',
    country: 'United Kingdom',
    content: 'Smooth import process from start to finish. ZafAutos handled all the shipping paperwork efficiently.',
    rating: 5,
  },
  {
    name: 'David O.',
    country: 'Kenya',
    content: 'Great pricing and excellent customer service. They kept me updated throughout the entire shipping process.',
    rating: 4,
  },
];

export function CustomerTestimonials() {
  return (
    <SectionWrapper>
      <PageHeader title="What Our Customers Say" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, i) => (
          <Card key={i} className="bg-card">
            <CardHeader className="pb-4">
              <div className="flex text-yellow-400 mb-2">
                {[...Array(5)].map((_, index) => (
                  <Star 
                    key={index} 
                    className={`h-4 w-4 ${index < testimonial.rating ? 'fill-current' : 'text-muted'}`} 
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-6 italic text-muted-foreground">&quot;{testimonial.content}&quot;</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.country}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
