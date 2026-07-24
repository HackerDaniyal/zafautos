import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dealers | ZafAutos Admin',
};

export default async function DealersPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealers"
        description="Manage dealer accounts"
      />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Dealer table coming soon.</p>
      </div>
    </div>
  );
}
