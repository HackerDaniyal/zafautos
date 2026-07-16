import React from 'react';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const news = [
  {
    title: 'New Export Regulations for 2026',
    date: 'July 10, 2026',
    excerpt: 'Understanding the recent changes in Japanese vehicle export regulations and how they affect your imports.',
  },
  {
    title: 'Top 5 SUVs for Off-Roading',
    date: 'July 5, 2026',
    excerpt: 'We review the best Japanese SUVs that combine reliability with exceptional off-road capabilities.',
  },
  {
    title: 'Hybrid vs Gas: What to Choose?',
    date: 'June 28, 2026',
    excerpt: 'A comprehensive guide to helping you decide between importing a hybrid or a traditional gas vehicle.',
  },
];

export function LatestNews() {
  return (
    <SectionWrapper className="bg-muted/30">
      <PageHeader 
        title="Latest News & Guides"
        action={
          <Button variant="ghost" asChild>
            <Link href="/news">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {news.map((item, i) => (
          <Card key={i} className="flex flex-col">
            <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground">
              Article Image
            </div>
            <CardHeader>
              <div className="text-sm text-muted-foreground mb-2">{item.date}</div>
              <CardTitle className="text-xl line-clamp-2">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground line-clamp-3">{item.excerpt}</p>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="px-0" asChild>
                <Link href="/news/placeholder">Read More</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
