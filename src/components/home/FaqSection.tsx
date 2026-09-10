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
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {title || 'Frequently Asked Questions'}
        </h2>
        {subtitle && (
          <p className="mt-3 text-gray-500">{subtitle}</p>
        )}
        {!subtitle && !title && (
          <p className="mt-3 text-gray-500">Everything you need to know about importing a vehicle with ZafAutos.</p>
        )}
      </div>
      <Accordion type="single" collapsible className="w-full rounded-xl border border-gray-200 bg-white">
        {faqItems.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-gray-200 px-4">
            <AccordionTrigger className="text-left font-medium text-gray-900 hover:text-[#E5231B]">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-500 leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </FAQSectionLayout>
  );
}
