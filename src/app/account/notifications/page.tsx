import { getMyNotifications } from '@/server/actions/accountActions';
import { NotificationsClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notifications | ZafAutos Japan' };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; category?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const data = await getMyNotifications({
    page,
    pageSize: 20,
    status: params.status,
    category: params.category,
  });

  const serialized = {
    ...data,
    notifications: data.notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
      readAt: n.readAt instanceof Date ? n.readAt.toISOString() : n.readAt ? String(n.readAt) : null,
    })),
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pure-white">Notifications</h1>
          <p className="text-sm text-steel mt-1">Stay updated on your orders, payments, and support</p>
        </div>
      </div>
      <NotificationsClient data={serialized} />
    </div>
  );
}
