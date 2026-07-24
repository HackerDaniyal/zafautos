import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | ZafAutos Admin',
};

export default async function BlogPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Blog" description="Manage blog posts" action={{ label: 'New Post', href: '/admin/blog/new' }} />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Blog management coming soon.</p>
      </div>
    </div>
  );
}
