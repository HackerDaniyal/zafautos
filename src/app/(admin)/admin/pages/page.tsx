import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { File } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pages | ZafAutos Admin',
};

export default async function PagesListPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Pages" description="Manage static pages" action={{ label: 'New Page', href: '/admin/pages/new' }} />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8">
        <EmptyState
          title="Content management is scheduled for Phase A.4"
          description="The CMS Pages module is part of the upcoming CMS & Homepage Management phase. It will include rich text editing, media integration, version history, SEO, and publishing workflows for About, Contact, Privacy, Terms, and other static pages."
          icon={File}
        />
      </div>
    </div>
  );
}
