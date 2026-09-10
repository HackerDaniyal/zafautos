import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/admin/ui/page-header';
import { BannerForm } from '../[id]/edit/form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Banner | ZafAutos Admin',
};

export default async function NewBannerPage() {
  const auth = await requireAuth();
  await requirePermission(auth, 'cms.create');

  return (
    <div className="space-y-6">
      <PageHeader title="New Banner" description="Create a new banner" />
      <BannerForm />
    </div>
  );
}
