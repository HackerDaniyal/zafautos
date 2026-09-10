import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/admin/ui/page-header';
import { TestimonialForm } from '../[id]/edit/form';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Testimonial | ZafAutos Admin' };

export default async function NewTestimonialPage() {
  const auth = await requireAuth();
  await requirePermission(auth, 'cms.create');
  return (<div className="space-y-6"><PageHeader title="New Testimonial" description="Add a customer testimonial" /><TestimonialForm /></div>);
}
