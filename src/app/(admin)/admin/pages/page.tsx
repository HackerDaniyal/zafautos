import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pages | ZafAutos Admin',
};

export default async function PagesListPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Pages" description="Manage static pages" action={{ label: 'New Page', href: '/admin/pages/new' }} />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Page management coming soon.</p>
      </div>
    </div>
  );
}
