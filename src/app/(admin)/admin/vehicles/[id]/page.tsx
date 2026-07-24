import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { VehicleDetailClient } from './client';

export const metadata: Metadata = {
  title: 'Vehicle Details | ZafAutos Admin',
};

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  return <VehicleDetailClient vehicleId={id} />;
}
