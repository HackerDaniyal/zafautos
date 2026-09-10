import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/admin/ui/page-header';
import { BlogPostForm } from './form';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Edit Post | ZafAutos Admin' };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuth();
  await requirePermission(auth, 'cms.update');
  return (<div className="space-y-6"><PageHeader title="Edit Post" description="Update blog post" /><BlogPostForm id={id} /></div>);
}
