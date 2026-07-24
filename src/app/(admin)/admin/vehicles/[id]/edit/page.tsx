import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { VehicleFormPage } from '../../components/vehicle-form-page';

export const metadata: Metadata = {
  title: 'Edit Vehicle | ZafAutos Admin',
};

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  return <VehicleFormPage mode="edit" vehicleId={id} />;
}
