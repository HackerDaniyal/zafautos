import React from 'react';
import { FAQSection as FAQSectionLayout } from '@/components/layout/SectionLayouts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  title?: string | null;
  subtitle?: string | null;
  items?: unknown;
}

const DEFAULT_FAQ: FaqItem[] = [
  { question: 'How long does shipping take?', answer: 'Shipping duration varies by destination. On average, it takes 3 to 6 weeks to reach most major ports worldwide after the vessel departs from Japan.' },
  { question: 'Do you provide inspection certificates?', answer: "Yes, we can arrange for JAAI, JEVIC, EAA, or other required pre-export inspections depending on your country's import regulations." },
  { question: 'What payment methods do you accept?', answer: 'We primarily accept Telegraphic Transfer (TT / Bank Transfer). All payments must be made in US Dollars or Japanese Yen as per the invoice.' },
  { question: 'Can you help with customs clearance?', answer: 'While we handle all the export procedures in Japan and shipping to your destination port, you or your local customs broker will be responsible for clearing customs upon arrival.' },
];

function parseFaq(data: unknown): FaqItem[] {
  if (!data || !Array.isArray(data)) return DEFAULT_FAQ;
  return data as FaqItem[];
}

export function FaqSection({ title, subtitle, items }: FaqSectionProps) {
  const faqItems = parseFaq(items);

  return (
    <FAQSectionLayout>
      <div className="text-center mb-12">
        <h2 className="font-[Oswald] text-3xl font-bold uppercase tracking-[0.3px] text-pure-white">
          {title || 'Frequently Asked Questions'}
        </h2>
        {subtitle && (
          <p className="mt-4 text-ash">{subtitle}</p>
        )}
        {!subtitle && !title && (
          <p className="mt-4 text-ash">Everything you need to know about importing a vehicle with ZafAutos.</p>
        )}
      </div>
      <Accordion type="single" collapsible className="w-full rounded-[10px] border border-iron bg-carbon p-4">
        {faqItems.map((faq, index) => (
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
