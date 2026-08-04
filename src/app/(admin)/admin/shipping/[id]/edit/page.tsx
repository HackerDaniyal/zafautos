import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getShipmentForEditAction } from '@/server/actions/shippingActions';
import { ShipmentFormPage } from '../../components/shipment-form-page';

export const metadata: Metadata = {
  title: 'Edit Shipment | ZafAutos Admin',
};

export default async function EditShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const result = await getShipmentForEditAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const shipment = result.data as {
    id: string;
    orderId: string;
    carrier: string | null;
    status: string;
  };

  return (
    <ShipmentFormPage
      mode="edit"
      initialData={{
        id: shipment.id,
        orderId: shipment.orderId,
        carrier: shipment.carrier,
        status: shipment.status,
      }}
    />
  );
}
