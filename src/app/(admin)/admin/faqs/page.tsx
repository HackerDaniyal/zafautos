import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/admin/ui/page-header';
import { FaqsClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'FAQs | ZafAutos Admin' };

export default async function FaqsPage() {
  const auth = await requireAuth();
  await requirePermission(auth, 'cms.read');
  return (<div className="space-y-6"><PageHeader title="FAQs" description="Manage frequently asked questions" action={{ label: 'New FAQ', href: '/admin/faqs/new' }} /><FaqsClient /></div>);
}
