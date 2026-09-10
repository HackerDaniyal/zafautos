import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { OrdersClient } from './client';

export const metadata: Metadata = {
  title: 'Orders | ZafAutos Admin',
};

export default async function OrdersPage() {
  await requireAuth();
  return <OrdersClient />;
}
