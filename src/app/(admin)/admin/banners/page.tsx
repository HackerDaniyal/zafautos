import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/admin/ui/page-header';
import { BannersClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Banners | ZafAutos Admin',
};

export default async function BannersPage() {
  const auth = await requireAuth();
  await requirePermission(auth, 'cms.read');

  return (
    <div className="space-y-6">
      <PageHeader title="Banners" description="Manage homepage and promotional banners" action={{ label: 'New Banner', href: '/admin/banners/new' }} />
      <BannersClient />
    </div>
  );
}
