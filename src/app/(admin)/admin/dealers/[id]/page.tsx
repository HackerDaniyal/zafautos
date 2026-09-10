import { requireAuth } from '@/lib/auth';
import { DealerDetailClient } from './client';
import type { Metadata } from 'next';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Dealer ${id.slice(0, 8)} | ZafAutos Admin` };
}

export default async function DealerDetailPage({ params }: Props) {
  await requireAuth();
  const { id } = await params;
  return <DealerDetailClient dealerId={id} />;
}
