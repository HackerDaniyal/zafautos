import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { PaymentDetailClient } from './client';

export const metadata: Metadata = {
  title: 'Payment Details | ZafAutos Admin',
};

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  return <PaymentDetailClient paymentId={id} />;
}
