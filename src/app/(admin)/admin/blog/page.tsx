import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/admin/ui/page-header';
import { BlogClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Blog | ZafAutos Admin' };

export default async function BlogPage() {
  const auth = await requireAuth();
  await requirePermission(auth, 'cms.read');
  return (<div className="space-y-6"><PageHeader title="Blog" description="Manage blog posts" action={{ label: 'New Post', href: '/admin/blog/new' }} /><BlogClient /></div>);
}
