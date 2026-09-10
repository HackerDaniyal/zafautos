import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/admin/ui/page-header';
import { TestimonialsClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Testimonials | ZafAutos Admin',
};

export default async function TestimonialsPage() {
  const auth = await requireAuth();
  await requirePermission(auth, 'cms.read');

  return (
    <div className="space-y-6">
      <PageHeader title="Testimonials" description="Manage customer testimonials" action={{ label: 'New Testimonial', href: '/admin/testimonials/new' }} />
      <TestimonialsClient />
    </div>
  );
}
