import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/admin/ui/page-header';
import { FaqForm } from './form';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Edit FAQ | ZafAutos Admin' };

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuth();
  await requirePermission(auth, 'cms.update');
  return (<div className="space-y-6"><PageHeader title="Edit FAQ" description="Update FAQ details" /><FaqForm id={id} /></div>);
}
