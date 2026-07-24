import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { VehiclesClient } from './client';

export const metadata: Metadata = {
  title: 'Vehicles | ZafAutos Admin',
};

export default async function VehiclesPage() {
  await requireAuth();
  return <VehiclesClient />;
}
