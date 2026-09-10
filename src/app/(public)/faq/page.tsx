import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CmsService } from '@/server/services/cmsService';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FAQ | ZafAutos',
  description: 'Frequently asked questions about buying a vehicle from ZafAutos.',
};

const cmsService = new CmsService();

export default async function FaqPage() {
  let faqs: any[] = [];
  try { faqs = await cmsService.getPublishedFaqs(); } catch { /* FAQ section will show empty state */ }

  const grouped = faqs.reduce((acc: Record<string, any[]>, faq) => {
    const cat = faq.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-500 mb-8">Find answers to common questions about buying a vehicle from ZafAutos.</p>
          {faqs.length === 0 ? (
            <p className="text-gray-500">No FAQs available yet. Please contact us for any questions.</p>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h2 className="text-xl font-semibold mb-4">{category}</h2>
                  <Accordion type="single" collapsible className="space-y-2">
                    {items.map((faq: any) => (
                      <AccordionItem key={faq.id} value={faq.id} className="border border-gray-200/30 rounded-[10px] px-4">
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-gray-500">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
