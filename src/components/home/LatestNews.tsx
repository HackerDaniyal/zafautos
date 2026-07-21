import React from 'react';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { placeholderNews } from '@/data/placeholderNews';

export function LatestNews() {
  return (
    <SectionWrapper className="bg-carbon">
      <PageHeader 
        title="Latest News & Guides"
        action={
          <Button variant="ghost" asChild className="text-steel hover:text-pure-white hover:bg-transparent">
            <Link href="/news">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {placeholderNews.map((item, i) => (
          <div key={i} className="flex flex-col rounded-[10px] border border-iron bg-deep-carbon overflow-hidden">
            <div className="aspect-video bg-iron/30 flex items-center justify-center text-steel">
              Article Image
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="text-[11px] uppercase tracking-wider text-steel mb-2">{item.date}</div>
              <h3 className="font-[Oswald] text-xl font-bold uppercase tracking-[0.3px] text-pure-white line-clamp-2 mb-2">{item.title}</h3>
              <p className="text-ash line-clamp-3 flex-1">{item.excerpt}</p>
              <Link href="/news/placeholder" className="mt-4 text-signal-red text-sm font-medium hover:underline">
                Read More
              </Link>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
