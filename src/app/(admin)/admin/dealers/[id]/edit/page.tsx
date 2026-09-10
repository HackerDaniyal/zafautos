import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getDealerForEditAction } from '@/server/actions/dealerActions';
import { DealerFormPage } from '../../components/dealer-form-page';

export const metadata: Metadata = {
  title: 'Edit Dealer | ZafAutos Admin',
};

export default async function EditDealerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const result = await getDealerForEditAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const dealer = result.data as {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    phone: string | null;
    status: string | null;
  };

  return (
    <DealerFormPage
      mode="edit"
      initialData={{
        id: dealer.id,
        email: dealer.email ?? '',
        firstName: dealer.firstName ?? null,
        lastName: dealer.lastName ?? null,
        displayName: dealer.displayName ?? null,
        phone: dealer.phone ?? null,
        status: dealer.status ?? 'active',
      }}
    />
  );
}
