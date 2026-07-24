import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { FuelTypesClient } from './client';

export const metadata: Metadata = { title: 'Fuel Types | ZafAutos Admin' };

export default async function FuelTypesPage() {
  await requireAuth();
  return <FuelTypesClient />;
}
