import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { CountriesClient } from './client';

export const metadata: Metadata = { title: 'Countries | ZafAutos Admin' };

export default async function CountriesPage() {
  await requireAuth();
  return <CountriesClient />;
}
