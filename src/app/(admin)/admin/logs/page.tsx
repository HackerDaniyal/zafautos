import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logs | ZafAutos Admin',
};

export default async function LogsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Logs" description="System activity logs" />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Audit logs coming soon.</p>
      </div>
    </div>
  );
}
