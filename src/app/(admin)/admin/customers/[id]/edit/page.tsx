import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getCustomerForEditAction } from '@/server/actions/customerActions';
import { CustomerFormPage } from '../../components/customer-form-page';

export const metadata: Metadata = {
  title: 'Edit Customer | ZafAutos Admin',
};

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const result = await getCustomerForEditAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const customer = result.data as {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    status: string | null;
  };

  return (
    <CustomerFormPage
      mode="edit"
      initialData={{
        id: customer.id,
        email: customer.email ?? '',
        firstName: customer.firstName ?? null,
        lastName: customer.lastName ?? null,
        displayName: null,
        phone: customer.phone ?? null,
        status: customer.status ?? 'active',
      }}
    />
  );
}
