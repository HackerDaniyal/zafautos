import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { ModelsClient } from './client';

export const metadata: Metadata = { title: 'Models | ZafAutos Admin' };

export default async function ModelsPage() {
  await requireAuth();
  return <ModelsClient />;
}
