import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import { MediaLibraryClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media Library | ZafAutos Admin',
};

export default async function MediaPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Manage images, documents, and files across storage buckets"
      />
      <MediaLibraryClient />
    </div>
  );
}
