import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users | ZafAutos Admin',
};

export default async function UsersPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage system users"
      />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Users table with existing management UI coming soon.</p>
      </div>
    </div>
  );
}
