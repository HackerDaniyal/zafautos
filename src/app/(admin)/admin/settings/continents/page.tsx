import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { ContinentsClient } from './client';

export const metadata: Metadata = { title: 'Continents | ZafAutos Admin' };

export default async function ContinentsPage() {
  await requireAuth();
  return <ContinentsClient />;
}
