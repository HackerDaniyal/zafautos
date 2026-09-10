import { requireAuth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui/page-header';
import { RoleDetailClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Role Details | ZafAutos Admin',
};

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAuth();
  const { id } = await params;

  if (auth.role !== 'super_admin') {
    redirect('/admin/roles');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Permissions"
        description="Assign granular permissions to this role"
        action={{ label: '← Back to Roles', href: '/admin/roles' }}
      />
      <RoleDetailClient roleId={id} />
    </div>
  );
}
