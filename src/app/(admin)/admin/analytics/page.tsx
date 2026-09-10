import { requireAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui/page-header';
import { AnalyticsClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | ZafAutos Admin',
};

export default async function AnalyticsPage() {
  const auth = await requireAuth();
  await requirePermission(auth, 'analytics.read');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform analytics, engagement metrics, and business intelligence"
      />
      <AnalyticsClient />
    </div>
  );
}
