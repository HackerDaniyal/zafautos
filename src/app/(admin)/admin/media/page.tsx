import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/admin/ui/page-header';
import { MediaClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Media Library | ZafAutos Admin' };

export default async function MediaPage() {
  const auth = await requireAuth();
  await requirePermission(auth, 'cms.read');
  return (<div className="space-y-6"><PageHeader title="Media Library" description="Manage uploaded media files" /><MediaClient /></div>);
}
