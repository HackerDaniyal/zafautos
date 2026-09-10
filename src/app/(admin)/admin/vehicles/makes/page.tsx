import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { MakesClient } from './client';

export const metadata: Metadata = { title: 'Makes | ZafAutos Admin' };

export default async function MakesPage() {
  await requireAuth();
  return <MakesClient />;
}
