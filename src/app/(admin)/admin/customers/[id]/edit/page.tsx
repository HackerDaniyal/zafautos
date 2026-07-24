import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { db } from '@/server/db/client';
import { customers, users, profiles } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
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

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!customer) {
    notFound();
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, customer.userId))
    .limit(1);

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, customer.userId))
    .limit(1);

  return (
    <CustomerFormPage
      mode="edit"
      initialData={{
        id: customer.id,
        email: user?.email ?? '',
        firstName: profile?.firstName ?? null,
        lastName: profile?.lastName ?? null,
        displayName: null,
        phone: profile?.phone ?? null,
        status: user?.status as string ?? 'active',
      }}
    />
  );
}
