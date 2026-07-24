import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { VehicleFormPage } from '../components/vehicle-form-page';

export const metadata: Metadata = {
  title: 'New Vehicle | ZafAutos Admin',
};

export default async function NewVehiclePage() {
  await requireAuth();
  return <VehicleFormPage mode="create" />;
}
