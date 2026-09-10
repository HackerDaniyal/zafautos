import { listSupportTicketsAdmin, getSupportStatusCounts } from '@/server/actions/supportActions';
import { AdminSupportListClient } from './client';

export const metadata = { title: 'Support Tickets | ZafAutos Admin' };

export default async function AdminSupportPage({ searchParams }: {
  searchParams: Promise<{ page?: string; status?: string; priority?: string; category?: string; search?: string }>
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const data = await listSupportTicketsAdmin({
    page,
    status: params.status,
    priority: params.priority,
    category: params.category,
    search: params.search,
    pageSize: 20,
  });

  const counts = await getSupportStatusCounts();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pure-white">Support Tickets</h1>
        <p className="text-sm text-steel mt-1">Manage customer support requests</p>
      </div>
      <AdminSupportListClient data={data} counts={counts} />
    </div>
  );
}
