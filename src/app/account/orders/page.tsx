import { getMyOrders } from '@/server/actions/accountActions';
import { OrdersListClient } from './client';

export const metadata = { title: 'My Orders | ZafAutos Japan' };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const status = sp.status || undefined;

  const data = await getMyOrders({ page, status, pageSize: 10 });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pure-white">My Orders</h1>
        <p className="text-sm text-steel mt-1">Track and manage your vehicle orders</p>
      </div>
      <OrdersListClient data={data} currentStatus={status} />
    </div>
  );
}
