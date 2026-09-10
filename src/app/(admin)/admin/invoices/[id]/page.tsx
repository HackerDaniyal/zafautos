import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { InvoicePreviewClient } from './client';

export const metadata: Metadata = {
  title: 'Invoice | ZafAutos Admin',
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  return <InvoicePreviewClient invoiceId={id} />;
}
