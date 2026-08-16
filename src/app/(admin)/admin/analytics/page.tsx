import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui/page-header';
import { AnalyticsClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | ZafAutos Admin',
};

export default async function AnalyticsPage() {
  const auth = await requireAuth();
  if (auth.role !== 'admin' && auth.role !== 'super_admin') {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform analytics, engagement metrics, and financial insights"
      />
      <AnalyticsClient />
    </div>
  );
}
