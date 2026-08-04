import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getOrderForEditAction } from '@/server/actions/orderActions';
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
  const result = await getOrderForEditAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const order = result.data as {
    id: string;
    orderNumber: string;
    customerId: string | null;
    dealerId: string | null;
    vehicleId: string | null;
    status: string;
    totalAmount: number;
  };

  return (
    <OrderFormPage
      mode="edit"
      initialData={{
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        dealerId: order.dealerId,
        vehicleId: order.vehicleId,
        status: order.status,
        totalAmount: order.totalAmount,
      }}
    />
  );
}
