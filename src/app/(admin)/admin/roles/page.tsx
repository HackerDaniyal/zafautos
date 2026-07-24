import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roles | ZafAutos Admin',
};

export default async function RolesPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" description="Manage user roles and permissions" />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Role management coming soon.</p>
      </div>
    </div>
  );
}
