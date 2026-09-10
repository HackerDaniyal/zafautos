import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { ColorsClient } from './client';

export const metadata: Metadata = { title: 'Colors | ZafAutos Admin' };

export default async function ColorsPage() {
  await requireAuth();
  return <ColorsClient />;
}
