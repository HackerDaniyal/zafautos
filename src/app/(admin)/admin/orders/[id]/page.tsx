import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { OrderDetailClient } from './client';

export const metadata: Metadata = {
  title: 'Order Details | ZafAutos Admin',
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  return <OrderDetailClient orderId={id} />;
}
