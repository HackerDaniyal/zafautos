import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { CustomerFormPage } from '../components/customer-form-page';

export const metadata: Metadata = {
  title: 'Create Customer | ZafAutos Admin',
};

export default async function NewCustomerPage() {
  await requireAuth();
  return <CustomerFormPage mode="create" />;
}
