import { requireAuth, requireRole } from '@/lib/auth';
import { UserManagementClient } from './client';
import { listUsers } from '@/server/actions/adminActions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users | ZafAutos Admin',
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string; page?: string }>;
}) {
  const auth = await requireAuth();
  requireRole(auth, 'admin', 'super_admin');

  const sp = await searchParams;
  const roleFilter = sp.role ?? '';
  const statusFilter = sp.status ?? '';
  const page = Number(sp.page ?? '1') || 1;

  const result = await listUsers({
    page,
    limit: 20,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const users = (result.success ? result.data?.users ?? [] : []) as Parameters<typeof UserManagementClient>[0]['users'];
  const total = result.success ? result.data?.total ?? 0 : 0;
  const limit = result.success ? result.data?.limit ?? 20 : 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <UserManagementClient
      users={users}
      total={total}
      page={page}
      totalPages={totalPages}
      roleFilter={roleFilter}
      statusFilter={statusFilter}
      currentUserId={auth.userId}
      callerRole={auth.role}
    />
  );
}
