import { getMySupportTickets } from '@/server/actions/supportActions';
import { SupportListClient } from './client';

export const metadata = { title: 'Support | ZafAutos Japan' };

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; create?: string; orderId?: string; category?: string }> }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const status = sp.status || undefined;

  const data = await getMySupportTickets({ page, status, pageSize: 10 });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pure-white">Support</h1>
          <p className="text-sm text-steel mt-1">Get help with your orders and account</p>
        </div>
      </div>
      <SupportListClient
        data={data}
        currentStatus={status}
        defaultOrderId={sp.orderId}
        defaultCategory={sp.category}
      />
    </div>
  );
}
