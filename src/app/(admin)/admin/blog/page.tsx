import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { PenTool } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | ZafAutos Admin',
};

export default async function BlogPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Blog" description="Manage blog posts" action={{ label: 'New Post', href: '/admin/blog/new' }} />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8">
        <EmptyState
          title="Content management is scheduled for Phase A.4"
          description="The Blog module is part of the upcoming CMS & Homepage Management phase. It will include rich text editing, media integration, categories, tags, SEO, and publishing workflows."
          icon={PenTool}
        />
      </div>
    </div>
  );
}
