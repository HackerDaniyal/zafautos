import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { TransmissionsClient } from './client';

export const metadata: Metadata = { title: 'Transmissions | ZafAutos Admin' };

export default async function TransmissionsPage() {
  await requireAuth();
  return <TransmissionsClient />;
}
