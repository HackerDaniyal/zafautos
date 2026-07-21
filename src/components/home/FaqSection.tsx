import React from 'react';
import { FAQSection as FAQSectionLayout } from '@/components/layout/SectionLayouts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { placeholderFaq } from '@/data/placeholderFaq';

export function FaqSection() {
  return (
    <FAQSectionLayout>
      <div className="text-center mb-12">
        <h2 className="font-[Oswald] text-3xl font-bold uppercase tracking-[0.3px] text-pure-white">Frequently Asked Questions</h2>
        <p className="mt-4 text-ash">Everything you need to know about importing a vehicle with ZafAutos.</p>
      </div>
      <Accordion type="single" collapsible className="w-full rounded-[10px] border border-iron bg-carbon p-4">
        {placeholderFaq.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-iron">
            <AccordionTrigger className="text-left font-medium text-pure-white hover:text-signal-red">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-ash leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </FAQSectionLayout>
  );
}
