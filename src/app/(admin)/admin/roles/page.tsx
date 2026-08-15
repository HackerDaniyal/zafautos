import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import { RolesListClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roles | ZafAutos Admin',
};

export default async function RolesPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Manage user roles and permissions"
      />
      <RolesListClient />
    </div>
  );
}
