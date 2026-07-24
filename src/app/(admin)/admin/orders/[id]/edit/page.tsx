import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { db } from '@/server/db/client';
import { orders } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { OrderFormPage } from '../../components/order-form-page';

export const metadata: Metadata = {
  title: 'Edit Order | ZafAutos Admin',
};

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    notFound();
  }

  return (
    <OrderFormPage
      mode="edit"
      initialData={{
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        dealerId: order.dealerId,
        vehicleId: order.vehicleId,
        status: order.status as string,
        totalAmount: order.totalAmount,
      }}
    />
  );
}
