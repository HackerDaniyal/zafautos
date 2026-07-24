import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | ZafAutos Admin',
};

export default async function AnalyticsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform analytics and insights"
      />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Analytics dashboard coming soon.</p>
      </div>
    </div>
  );
}
