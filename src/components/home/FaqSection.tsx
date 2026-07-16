import React from 'react';
import { FAQSection as FAQSectionLayout } from '@/components/layout/SectionLayouts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How long does shipping take?',
    answer: 'Shipping duration varies by destination. On average, it takes 3 to 6 weeks to reach most major ports worldwide after the vessel departs from Japan.',
  },
  {
    question: 'Do you provide inspection certificates?',
    answer: 'Yes, we can arrange for JAAI, JEVIC, EAA, or other required pre-export inspections depending on your country\'s import regulations.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We primarily accept Telegraphic Transfer (TT / Bank Transfer). All payments must be made in US Dollars or Japanese Yen as per the invoice.',
  },
  {
    question: 'Can you help with customs clearance?',
    answer: 'While we handle all the export procedures in Japan and shipping to your destination port, you or your local customs broker will be responsible for clearing customs upon arrival.',
  },
];

export function FaqSection() {
  return (
    <FAQSectionLayout>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
        <p className="mt-4 text-muted-foreground">Everything you need to know about importing a vehicle with ZafAutos.</p>
      </div>
      <Accordion type="single" collapsible className="w-full bg-card rounded-lg p-4 shadow-sm border">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </FAQSectionLayout>
  );
}
