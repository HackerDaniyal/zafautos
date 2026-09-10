import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui/page-header';
import { AuditLogListClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit Logs | ZafAutos Admin',
};

export default async function LogsPage() {
  const auth = await requireAuth();
  if (auth.role !== 'admin' && auth.role !== 'super_admin') {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="System activity and change history" />
      <AuditLogListClient />
    </div>
  );
}
