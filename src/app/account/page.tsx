import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/auth/rbac';

export default async function AccountPage() {
  const auth = await requireAuth();
  requireRole(auth, 'customer');
  redirect('/account/orders');
}
