import { requireAuth } from '@/lib/auth';
import { CustomersClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customers | ZafAutos Admin',
};

export default async function CustomersPage() {
  await requireAuth();
  return <CustomersClient />;
}
