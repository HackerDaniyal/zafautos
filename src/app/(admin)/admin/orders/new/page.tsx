import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { OrderFormPage } from '../components/order-form-page';

export const metadata: Metadata = {
  title: 'Create Order | ZafAutos Admin',
};

export default async function NewOrderPage() {
  await requireAuth();
  return <OrderFormPage mode="create" />;
}
