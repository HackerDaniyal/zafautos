import { requireAuth } from '@/lib/auth';
import { PaymentsClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payments | ZafAutos Admin',
};

export default async function PaymentsPage() {
  await requireAuth();
  return <PaymentsClient />;
}
