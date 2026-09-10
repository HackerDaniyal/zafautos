import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { LeadDetailClient } from './client';

export const metadata: Metadata = {
  title: 'Lead Details | ZafAutos Admin',
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  return <LeadDetailClient leadId={id} />;
}
