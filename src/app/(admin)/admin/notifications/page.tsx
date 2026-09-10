import { requireAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/admin/ui/page-header';
import { AdminNotificationsClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications | ZafAutos Admin',
};

export default async function AdminNotificationsPage() {
  const auth = await requireAuth();
  await requirePermission(auth, 'notifications.read');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="View your notifications and alerts"
      />
      <AdminNotificationsClient />
    </div>
  );
}
