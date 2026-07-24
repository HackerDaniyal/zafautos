import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payments | ZafAutos Admin',
};

export default async function PaymentsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Manage payments and invoices"
      />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Payments table coming soon.</p>
      </div>
    </div>
  );
}
