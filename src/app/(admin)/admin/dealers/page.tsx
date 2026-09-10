import { requireAuth } from '@/lib/auth';
import { DealersClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dealers | ZafAutos Admin',
};

export default async function DealersPage() {
  await requireAuth();
  return <DealersClient />;
}
