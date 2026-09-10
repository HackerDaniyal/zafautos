import { notFound } from 'next/navigation';
import { getMyOrderDetail } from '@/server/actions/accountActions';
import { OrderDetailClient } from './client';

export const metadata = { title: 'Order Detail | ZafAutos Japan' };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getMyOrderDetail(id);
  if (!order) notFound();

  return <OrderDetailClient order={order} />;
}
