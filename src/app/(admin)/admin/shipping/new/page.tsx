import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { ShipmentFormPage } from '../components/shipment-form-page';

export const metadata: Metadata = {
  title: 'Create Shipment | ZafAutos Admin',
};

export default async function NewShipmentPage() {
  await requireAuth();
  return <ShipmentFormPage mode="create" />;
}
