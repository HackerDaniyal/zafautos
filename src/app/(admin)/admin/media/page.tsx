import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media Library | ZafAutos Admin',
};

export default async function MediaPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Media Library" description="Manage images and files" />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Media library coming soon.</p>
      </div>
    </div>
  );
}
