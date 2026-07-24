import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { db } from '@/server/db/client';
import { shipments } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
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
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.id, id))
    .limit(1);

  if (!shipment) {
    notFound();
  }

  return (
    <ShipmentFormPage
      mode="edit"
      initialData={{
        id: shipment.id,
        orderId: shipment.orderId,
        carrier: shipment.carrier,
        status: shipment.status as string,
      }}
    />
  );
}
