import { requireAuth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui/page-header';
import { AuditLogDetailClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit Log Detail | ZafAutos Admin',
};

export default async function AuditLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAuth();
  if (auth.role !== 'admin' && auth.role !== 'super_admin') {
    redirect('/admin/logs');
  }

  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log Entry"
        description="Detailed view of this audit event"
        action={{ label: '← Back to Logs', href: '/admin/logs' }}
      />
      <AuditLogDetailClient logId={id} />
    </div>
  );
}
