import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents | ZafAutos Admin',
};

export default async function DocumentsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Manage documents and files" />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Document management coming soon.</p>
      </div>
    </div>
  );
}
