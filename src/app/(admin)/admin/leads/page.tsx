import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { LeadsClient } from './client';

export const metadata: Metadata = {
  title: 'Leads | ZafAutos Admin',
};

export default async function LeadsPage() {
  await requireAuth();
  return <LeadsClient />;
}
