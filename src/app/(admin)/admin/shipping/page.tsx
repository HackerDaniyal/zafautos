import { requireAuth } from '@/lib/auth';
import { ShippingClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping | ZafAutos Admin',
};

export default async function ShippingPage() {
  await requireAuth();
  return <ShippingClient />;
}
